using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using UXFriends.Domain.Entities;
using UXFriends.Infrastructure.Data;
using UXFriends.Application.Services;
using UXFriends.Infrastructure.Services;
using UXFriends.API.Support;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<DatabaseSeeder>();
builder.Services.AddHttpClient();
builder.Services.AddMemoryCache();

// Add services to the container
builder.Services.AddControllers();

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// Configure Database
var databaseProvider = builder.Configuration["DatabaseProvider"] ?? "Sqlite";
var authCookieName = (builder.Configuration["Auth:CookieName"] ?? "uxfriends_auth").Trim();
var sqliteConnectionString = ResolveSqliteConnectionString(builder.Configuration);
builder.Services.AddDbContext<UXFriendsDbContext>(options =>
{
    if (databaseProvider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
    {
        options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
        return;
    }

    options.UseSqlite(sqliteConnectionString);
});

// Configure Identity
builder.Services.AddIdentity<User, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 8;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<UXFriendsDbContext>()
.AddDefaultTokenProviders();

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            if (!string.IsNullOrWhiteSpace(context.Token))
            {
                return Task.CompletedTask;
            }

            if (context.Request.Cookies.TryGetValue(authCookieName, out var cookieToken) &&
                !string.IsNullOrWhiteSpace(cookieToken))
            {
                context.Token = cookieToken;
            }

            return Task.CompletedTask;
        }
    };
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// Configure CORS
var allowedFrontendOrigins = BuildAllowedFrontendOrigins(builder.Configuration);
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedFrontendOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "UXFriends API",
        Version = "v1",
        Description = "API for UXFriends Learning Platform"
    });

    // Add JWT Authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

app.UseForwardedHeaders();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHttpsRedirection();
}

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("index.html");

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<UXFriendsDbContext>();
    if (dbContext.Database.IsSqlite())
    {
        var schemaCreatedFromModel = await PrepareSqliteDatabaseAsync(dbContext);
        if (!schemaCreatedFromModel)
        {
            await dbContext.Database.MigrateAsync();
        }
    }
    else
    {
        await dbContext.Database.MigrateAsync();
    }

    var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
    await seeder.SeedAsync();
    await PruneLegacyCatalogRecordsAsync(dbContext);
    await NormalizeLegacyProjectReviewStateAsync(dbContext);
    await NormalizeXpEconomyAsync(dbContext);
    await SyncStoredLearningLevelsAsync(dbContext);
    await EmailVerificationPolicy.PruneExpiredUnverifiedUsersAsync(dbContext, DateTime.UtcNow);
    await LeagueEngine.SyncAsync(dbContext, DateTime.UtcNow);
    await ChallengeRewardSettlementEngine.SyncAsync(dbContext, DateTime.UtcNow);
}

app.Run();

static string ResolveSqliteConnectionString(IConfiguration configuration)
{
    const string defaultConnectionString = "Data Source=uxfriends.db";
    var configuredConnectionString = configuration.GetConnectionString("SqliteConnection")?.Trim();

    if (!string.IsNullOrWhiteSpace(configuredConnectionString) &&
        !configuredConnectionString.Equals(defaultConnectionString, StringComparison.OrdinalIgnoreCase))
    {
        return configuredConnectionString;
    }

    var azureHome = Environment.GetEnvironmentVariable("HOME");
    var azureSiteName = Environment.GetEnvironmentVariable("WEBSITE_SITE_NAME");
    if (!string.IsNullOrWhiteSpace(azureHome) && !string.IsNullOrWhiteSpace(azureSiteName))
    {
        var dataDirectory = Path.Combine(azureHome, "data");
        Directory.CreateDirectory(dataDirectory);
        return $"Data Source={Path.Combine(dataDirectory, "uxfriends.db")}";
    }

    return configuredConnectionString ?? defaultConnectionString;
}

static async Task<bool> PrepareSqliteDatabaseAsync(UXFriendsDbContext dbContext)
{
    if (!dbContext.Database.IsSqlite())
    {
        return false;
    }

    await using var connection = dbContext.Database.GetDbConnection();
    if (connection.State != System.Data.ConnectionState.Open)
    {
        await connection.OpenAsync();
    }

    var hasMigrationHistory = await TableExistsAsync(connection, "__EFMigrationsHistory");
    await using var appTableCommand = connection.CreateCommand();
    appTableCommand.CommandText = @"
        SELECT COUNT(*)
        FROM sqlite_master
        WHERE type = 'table'
          AND name NOT LIKE 'sqlite_%'
          AND name <> '__EFMigrationsHistory'";
    var existingAppTables = Convert.ToInt32(await appTableCommand.ExecuteScalarAsync());
    var appliedMigrationCount = hasMigrationHistory
        ? await CountSqliteMigrationHistoryRowsAsync(connection)
        : 0;

    if (hasMigrationHistory && appliedMigrationCount == 0)
    {
        if (existingAppTables == 0)
        {
            await using var dropEmptyHistoryCommand = connection.CreateCommand();
            dropEmptyHistoryCommand.CommandText = "DROP TABLE IF EXISTS __EFMigrationsHistory";
            await dropEmptyHistoryCommand.ExecuteNonQueryAsync();

            await connection.CloseAsync();
            await dbContext.Database.EnsureCreatedAsync();

            await using var recreatedConnection = dbContext.Database.GetDbConnection();
            if (recreatedConnection.State != System.Data.ConnectionState.Open)
            {
                await recreatedConnection.OpenAsync();
            }

            await EnsureSqliteMigrationHistoryTableAsync(recreatedConnection);
            await StampAllSqliteMigrationsAsync(dbContext, recreatedConnection);
            return true;
        }

        await StampAllSqliteMigrationsAsync(dbContext, connection);
        return true;
    }

    if (!hasMigrationHistory && existingAppTables == 0)
    {
        await connection.CloseAsync();
        await dbContext.Database.EnsureCreatedAsync();
        await using var recreatedConnection = dbContext.Database.GetDbConnection();
        if (recreatedConnection.State != System.Data.ConnectionState.Open)
        {
            await recreatedConnection.OpenAsync();
        }

        await EnsureSqliteMigrationHistoryTableAsync(recreatedConnection);
        await StampAllSqliteMigrationsAsync(dbContext, recreatedConnection);
        return true;
    }

    if (hasMigrationHistory)
    {
        return false;
    }

    await EnsureSqliteMigrationHistoryTableAsync(connection);
    await StampAllSqliteMigrationsAsync(dbContext, connection);
    return false;
}

static async Task EnsureSqliteMigrationHistoryTableAsync(System.Data.Common.DbConnection connection)
{
    if (await TableExistsAsync(connection, "__EFMigrationsHistory"))
    {
        return;
    }

    await using var createHistoryCommand = connection.CreateCommand();
    createHistoryCommand.CommandText = @"
        CREATE TABLE IF NOT EXISTS ""__EFMigrationsHistory"" (
            ""MigrationId"" TEXT NOT NULL CONSTRAINT ""PK___EFMigrationsHistory"" PRIMARY KEY,
            ""ProductVersion"" TEXT NOT NULL
        );";
    await createHistoryCommand.ExecuteNonQueryAsync();
}

static async Task StampAllSqliteMigrationsAsync(UXFriendsDbContext dbContext, System.Data.Common.DbConnection connection)
{
    var productVersion =
        typeof(DbContext).Assembly
            .GetCustomAttributes(typeof(System.Reflection.AssemblyInformationalVersionAttribute), false)
            .OfType<System.Reflection.AssemblyInformationalVersionAttribute>()
            .FirstOrDefault()?.InformationalVersion.Split('+')[0]
        ?? "8.0.0";

    foreach (var migrationId in dbContext.Database.GetMigrations())
    {
        await using var insertCommand = connection.CreateCommand();
        insertCommand.CommandText = @"
            INSERT OR IGNORE INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
            VALUES ($migrationId, $productVersion);";

        var migrationParameter = insertCommand.CreateParameter();
        migrationParameter.ParameterName = "$migrationId";
        migrationParameter.Value = migrationId;
        insertCommand.Parameters.Add(migrationParameter);

        var versionParameter = insertCommand.CreateParameter();
        versionParameter.ParameterName = "$productVersion";
        versionParameter.Value = productVersion;
        insertCommand.Parameters.Add(versionParameter);

        await insertCommand.ExecuteNonQueryAsync();
    }
}

static async Task<bool> TableExistsAsync(System.Data.Common.DbConnection dbConnection, string tableName)
{
    await using var command = dbConnection.CreateCommand();
    command.CommandText = "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = $name";
    var parameter = command.CreateParameter();
    parameter.ParameterName = "$name";
    parameter.Value = tableName;
    command.Parameters.Add(parameter);
    var result = await command.ExecuteScalarAsync();
    return Convert.ToInt32(result) > 0;
}

static async Task<int> CountSqliteMigrationHistoryRowsAsync(System.Data.Common.DbConnection dbConnection)
{
    await using var command = dbConnection.CreateCommand();
    command.CommandText = "SELECT COUNT(*) FROM \"__EFMigrationsHistory\"";
    var result = await command.ExecuteScalarAsync();
    return Convert.ToInt32(result);
}

static async Task NormalizeLegacyProjectReviewStateAsync(UXFriendsDbContext dbContext)
{
    var currentProjectCodes = CourseBlueprintCatalog.Sections
        .Select(item => item.Project.Code)
        .ToHashSet(StringComparer.OrdinalIgnoreCase);

    var legacySubmittedProjects = await dbContext.ProjectSubmissions
        .Where(item =>
            currentProjectCodes.Contains(item.ProjectCode) &&
            item.Status != "Approved")
        .ToListAsync();

    foreach (var submission in legacySubmittedProjects)
    {
        submission.Status = "Approved";
    }

    var approvedSubmissions = (await dbContext.ProjectSubmissions
        .Where(item =>
            currentProjectCodes.Contains(item.ProjectCode) &&
            item.Status == "Approved")
        .ToListAsync())
        .GroupBy(item => new { item.UserId, item.ProjectCode })
        .Select(group => group
            .OrderByDescending(item => item.SubmittedAt)
            .ThenByDescending(item => item.SubmissionId)
            .First())
        .ToList();

    var existingProjectRewardKeys = await dbContext.XPLogs
        .Where(item =>
            item.ActivityType == "ProjectCompleted" &&
            item.ReferenceId != null)
        .Select(item => $"{item.UserId}|{item.ReferenceId}")
        .ToListAsync();
    var rewardLookup = existingProjectRewardKeys.ToHashSet(StringComparer.OrdinalIgnoreCase);
    var missingProjectRewardLogs = new List<XPLog>();

    foreach (var submission in approvedSubmissions)
    {
        var rewardKey = $"{submission.UserId}|{submission.ProjectCode}";
        if (rewardLookup.Contains(rewardKey))
        {
            continue;
        }

        var xpReward = LearningExperienceCatalog.FindProject(submission.ProjectCode)?.XpReward ?? XpEconomy.DefaultProjectReward;
        missingProjectRewardLogs.Add(new XPLog
        {
            LogCode = Guid.NewGuid().ToString("N"),
            UserId = submission.UserId,
            XP = xpReward,
            ActivityType = "ProjectCompleted",
            ReferenceId = submission.ProjectCode,
            CreatedAt = submission.SubmittedAt
        });
        rewardLookup.Add(rewardKey);
    }

    if (legacySubmittedProjects.Count == 0 && missingProjectRewardLogs.Count == 0)
    {
        return;
    }

    if (missingProjectRewardLogs.Count > 0)
    {
        dbContext.XPLogs.AddRange(missingProjectRewardLogs);
    }

    await dbContext.SaveChangesAsync();
    await RecalculateUserProgressStatsAsync(dbContext);
}

static async Task NormalizeXpEconomyAsync(UXFriendsDbContext dbContext)
{
    var xpLogs = await dbContext.XPLogs
        .OrderBy(item => item.CreatedAt)
        .ThenBy(item => item.LogCode)
        .ToListAsync();

    var changed = false;

    foreach (var log in xpLogs)
    {
        var normalizedXp = ResolveNormalizedXp(log);
        if (normalizedXp is null || normalizedXp.Value == log.XP)
        {
            continue;
        }

        log.XP = normalizedXp.Value;
        changed = true;
    }

    if (!changed)
    {
        return;
    }

    await dbContext.SaveChangesAsync();
    await RecalculateUserProgressStatsAsync(dbContext);
}

static int? ResolveNormalizedXp(XPLog log)
{
    return log.ActivityType switch
    {
        "LessonCompleted" => log.ReferenceId is null
            ? null
            : CatalogContent.FindLesson(log.ReferenceId)?.XpReward,
        "LessonQuizCompleted" or "LessonQuizPassed" => log.ReferenceId is null
            ? null
            : LearningExperienceCatalog.BuildLessonQuiz(log.ReferenceId)?.XpReward,
        "UnitQuizCompleted" or "UnitQuizPassed" => log.ReferenceId is null
            ? null
            : LearningExperienceCatalog.BuildUnitQuiz(log.ReferenceId)?.XpReward,
        "SectionQuizCompleted" or "SectionQuizPassed" => log.ReferenceId is null
            ? null
            : LearningExperienceCatalog.BuildSectionQuiz(log.ReferenceId)?.XpReward,
        "ProjectCompleted" => log.ReferenceId is null
            ? null
            : LearningExperienceCatalog.FindProject(log.ReferenceId)?.XpReward ?? XpEconomy.DefaultProjectReward,
        "ChallengeCompleted" => GetChallengeCode(log.ReferenceId) is { } challengeCode
            ? CatalogContent.FindChallenge(challengeCode)?.XpReward
            : null,
        "DailyGoalCompleted" => GetDailyGoalCode(log.ReferenceId) is { } goalCode
            ? DailyGoalEngine.FindTemplate(goalCode)?.XpReward
            : null,
        "StreakReward" => TryParseStreakMilestone(log.ReferenceId, out var milestoneDays)
            ? XpEconomy.GetStreakReward(milestoneDays)
            : null,
        "LeagueWeeklyReward" => TryParseLeagueRewardRank(log.ReferenceId, out var leagueRank)
            ? XpEconomy.GetLeagueReward(leagueRank)
            : null,
        "RevisionSessionCompleted" => TryParseRevisionScore(log.ReferenceId, out var scorePercent)
            ? XpEconomy.GetRevisionSessionRewardFromScore(scorePercent)
            : null,
        _ => null
    };
}

static string? GetChallengeCode(string? referenceId)
{
    if (string.IsNullOrWhiteSpace(referenceId))
    {
        return null;
    }

    var separatorIndex = referenceId.IndexOf(':');
    return separatorIndex <= 0
        ? referenceId
        : referenceId[..separatorIndex];
}

static string? GetDailyGoalCode(string? referenceId)
{
    if (string.IsNullOrWhiteSpace(referenceId))
    {
        return null;
    }

    var separatorIndex = referenceId.IndexOf(':');
    if (separatorIndex < 0 || separatorIndex >= referenceId.Length - 1)
    {
        return null;
    }

    return referenceId[(separatorIndex + 1)..];
}

static bool TryParseStreakMilestone(string? referenceId, out int milestoneDays)
{
    milestoneDays = 0;
    if (string.IsNullOrWhiteSpace(referenceId))
    {
        return false;
    }

    var parts = referenceId.Split(':', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
    return parts.Length > 1 && int.TryParse(parts[^1], out milestoneDays);
}

static bool TryParseLeagueRewardRank(string? referenceId, out int rank)
{
    rank = 0;
    if (string.IsNullOrWhiteSpace(referenceId))
    {
        return false;
    }

    var parts = referenceId.Split(':', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
    return parts.Length > 0 && int.TryParse(parts[^1], out rank);
}

static bool TryParseRevisionScore(string? referenceId, out int scorePercent)
{
    scorePercent = 0;
    if (string.IsNullOrWhiteSpace(referenceId))
    {
        return false;
    }

    var parts = referenceId.Split('|', 2, StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
    return parts.Length == 2 && int.TryParse(parts[1], out scorePercent);
}

static async Task SyncStoredLearningLevelsAsync(UXFriendsDbContext dbContext)
{
    var users = await dbContext.Users.ToListAsync();
    var changed = false;

    foreach (var user in users)
    {
        if (await LearningAccessPolicy.SyncStoredSkillLevelAsync(dbContext, user))
        {
            changed = true;
        }
    }

    if (!changed)
    {
        return;
    }

    await dbContext.SaveChangesAsync();
}

static async Task PruneLegacyCatalogRecordsAsync(UXFriendsDbContext dbContext)
{
    var currentSectionCodes = CatalogContent.Sections
        .Select(item => item.Code)
        .ToHashSet(StringComparer.OrdinalIgnoreCase);
    var currentUnitCodes = CatalogContent.Units
        .Select(item => item.Code)
        .ToHashSet(StringComparer.OrdinalIgnoreCase);
    var currentLessonCodes = CatalogContent.Lessons
        .Select(item => item.Code)
        .ToHashSet(StringComparer.OrdinalIgnoreCase);
    var currentProjectCodes = CourseBlueprintCatalog.Sections
        .Select(item => item.Project.Code)
        .ToHashSet(StringComparer.OrdinalIgnoreCase);

    var legacyLessonProgress = await dbContext.LessonProgress
        .Where(item => !currentLessonCodes.Contains(item.LessonCode))
        .ToListAsync();
    var legacyQuizAttempts = await dbContext.QuizAttempts
        .Where(item =>
            (item.SectionCode != null && !currentSectionCodes.Contains(item.SectionCode)) ||
            (item.UnitCode != null && !currentUnitCodes.Contains(item.UnitCode)) ||
            (item.LessonCode != null && !currentLessonCodes.Contains(item.LessonCode)))
        .ToListAsync();
    var legacyCertificates = await dbContext.Certificates
        .Where(item => !currentSectionCodes.Contains(item.SectionCode))
        .ToListAsync();
    var legacyProjectSubmissions = await dbContext.ProjectSubmissions
        .Where(item => !currentProjectCodes.Contains(item.ProjectCode))
        .ToListAsync();
    var legacyXpLogs = await dbContext.XPLogs
        .Where(item =>
            (item.ActivityType == "LessonCompleted" && item.ReferenceId != null && !currentLessonCodes.Contains(item.ReferenceId)) ||
            (item.ActivityType == "LessonQuizCompleted" && item.ReferenceId != null && !currentLessonCodes.Contains(item.ReferenceId)) ||
            (item.ActivityType == "UnitQuizCompleted" && item.ReferenceId != null && !currentUnitCodes.Contains(item.ReferenceId)) ||
            (item.ActivityType == "SectionQuizCompleted" && item.ReferenceId != null && !currentSectionCodes.Contains(item.ReferenceId)) ||
            (item.ActivityType == "ProjectCompleted" && item.ReferenceId != null && !currentProjectCodes.Contains(item.ReferenceId)))
        .ToListAsync();
    var legacyProjects = await dbContext.Projects
        .Where(item => !currentProjectCodes.Contains(item.ProjectCode))
        .ToListAsync();
    var legacyLessons = await dbContext.Lessons
        .Where(item => !currentLessonCodes.Contains(item.LessonCode))
        .ToListAsync();
    var legacyUnits = await dbContext.Units
        .Where(item => !currentUnitCodes.Contains(item.UnitCode))
        .ToListAsync();
    var legacySections = await dbContext.Sections
        .Where(item => !currentSectionCodes.Contains(item.SectionCode))
        .ToListAsync();

    if (legacyLessonProgress.Count == 0 &&
        legacyQuizAttempts.Count == 0 &&
        legacyCertificates.Count == 0 &&
        legacyProjectSubmissions.Count == 0 &&
        legacyXpLogs.Count == 0 &&
        legacyProjects.Count == 0 &&
        legacyLessons.Count == 0 &&
        legacyUnits.Count == 0 &&
        legacySections.Count == 0)
    {
        return;
    }

    if (legacyLessonProgress.Count > 0)
    {
        dbContext.LessonProgress.RemoveRange(legacyLessonProgress);
    }

    if (legacyQuizAttempts.Count > 0)
    {
        dbContext.QuizAttempts.RemoveRange(legacyQuizAttempts);
    }

    if (legacyCertificates.Count > 0)
    {
        dbContext.Certificates.RemoveRange(legacyCertificates);
    }

    if (legacyProjectSubmissions.Count > 0)
    {
        dbContext.ProjectSubmissions.RemoveRange(legacyProjectSubmissions);
    }

    if (legacyXpLogs.Count > 0)
    {
        dbContext.XPLogs.RemoveRange(legacyXpLogs);
    }

    if (legacyProjects.Count > 0)
    {
        dbContext.Projects.RemoveRange(legacyProjects);
    }

    if (legacyLessons.Count > 0)
    {
        dbContext.Lessons.RemoveRange(legacyLessons);
    }

    if (legacyUnits.Count > 0)
    {
        dbContext.Units.RemoveRange(legacyUnits);
    }

    if (legacySections.Count > 0)
    {
        dbContext.Sections.RemoveRange(legacySections);
    }

    await dbContext.SaveChangesAsync();
    await RecalculateUserProgressStatsAsync(dbContext);
}

static async Task RecalculateUserProgressStatsAsync(UXFriendsDbContext dbContext)
{
    var users = await dbContext.Users.ToListAsync();
    if (users.Count == 0)
    {
        return;
    }

    var userIds = users.Select(item => item.Id).ToList();
    var lessonCounts = await dbContext.LessonProgress
        .Where(item =>
            userIds.Contains(item.UserId) &&
            (item.CompletedAt != null || item.Status == "Completed"))
        .GroupBy(item => item.UserId)
        .Select(group => new
        {
            UserId = group.Key,
            Count = group.Select(item => item.LessonCode).Distinct().Count()
        })
        .ToDictionaryAsync(item => item.UserId, item => item.Count);
    var projectCounts = await dbContext.ProjectSubmissions
        .Where(item => userIds.Contains(item.UserId) && item.Status == "Approved")
        .GroupBy(item => item.UserId)
        .Select(group => new
        {
            UserId = group.Key,
            Count = group.Select(item => item.ProjectCode).Distinct().Count()
        })
        .ToDictionaryAsync(item => item.UserId, item => item.Count);
    var challengeCounts = await dbContext.UserChallenges
        .Where(item => userIds.Contains(item.UserId) && item.CompletedAt != null)
        .GroupBy(item => item.UserId)
        .Select(group => new
        {
            UserId = group.Key,
            Count = group.Count()
        })
        .ToDictionaryAsync(item => item.UserId, item => item.Count);
    var logsByUser = await dbContext.XPLogs
        .Where(item => userIds.Contains(item.UserId))
        .OrderBy(item => item.CreatedAt)
        .ThenBy(item => item.LogCode)
        .GroupBy(item => item.UserId)
        .ToDictionaryAsync(group => group.Key, group => group.ToList());

    foreach (var user in users)
    {
        user.Level = 1;
        user.TotalXP = 0;
        user.CurrentXP = 0;
        user.NextLevelXP = 1000;
        user.Coins = 0;
        user.LessonsCompleted = lessonCounts.GetValueOrDefault(user.Id, 0);
        user.ProjectsCompleted = projectCounts.GetValueOrDefault(user.Id, 0);
        user.ChallengesWon = challengeCounts.GetValueOrDefault(user.Id, 0);

        foreach (var log in logsByUser.GetValueOrDefault(user.Id, []))
        {
            GamificationHelper.ApplyXp(user, log.XP);
        }
    }

    await dbContext.SaveChangesAsync();
}

static string[] BuildAllowedFrontendOrigins(IConfiguration configuration)
{
    var origins = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

    AddOrigin(origins, "http://localhost:3000");
    AddOrigin(origins, "http://localhost:5173");
    AddOrigin(origins, "http://127.0.0.1:5173");
    AddOrigin(origins, configuration["Frontend:BaseUrl"]);
    AddOrigin(origins, configuration["RENDER_EXTERNAL_URL"]);

    foreach (var origin in configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [])
    {
        AddOrigin(origins, origin);
    }

    return origins.ToArray();
}

static void AddOrigin(HashSet<string> origins, string? origin)
{
    if (string.IsNullOrWhiteSpace(origin))
    {
        return;
    }

    origins.Add(origin.Trim().TrimEnd('/'));
}
