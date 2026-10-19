using Hangfire;
using MedMonitor.Core.Mapping;
using MedMonitor.Extenstions;
using MedMonitor.Hubs;
using MedMonitor.Infrastructure.Data;
using MedMonitor.Infrastructure.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Net.Http.Headers;
using Microsoft.OpenApi.Models;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace MedMonitor
{
    public class Program
    {
        public static async System.Threading.Tasks.Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            builder.WebHost.UseUrls("http://*:5140", "https://*:7191");

            builder.Services.AddDbContext<AppDbContext>(option =>
            {
                option.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
                option.EnableSensitiveDataLogging();
            });

            builder.Services.AddIdentityCore<User>(op => op.Password = new PasswordOptions
            {
                RequireDigit = false,
                RequireLowercase = false,
                RequireNonAlphanumeric = false,
                RequireUppercase = false,
                RequiredUniqueChars = 0,
                RequiredLength = 6,
            })
            .AddRoles<IdentityRole<string>>()
            .AddSignInManager<SignInManager<User>>()
            .AddUserManager<UserManager<User>>()
            .AddDefaultTokenProviders()
            .AddEntityFrameworkStores<AppDbContext>();

            builder.Services.AddControllers()
                .AddNewtonsoftJson(x =>
                    x.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore)
                .AddJsonOptions(x => {
                    x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
                    x.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;  // ✅ Convert to camelCase
                });

            builder.Services.AddEndpointsApiExplorer();

            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "MedMonitor", Version = "v1" });
                c.AddSecurityDefinition("token", new OpenApiSecurityScheme
                {
                    Type = SecuritySchemeType.Http,
                    In = ParameterLocation.Header,
                    Name = HeaderNames.Authorization,
                    Scheme = "Bearer"
                });
                c.OperationFilter<SecureEndpointAuthRequirementFilter>();
            });

            builder.Services.Configure<TwilioSettings>(builder.Configuration.GetSection("Twilio"));
            builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
            builder.Services.RegisterService();
            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(policy =>
                {
                    policy.AllowAnyOrigin()
                          .AllowAnyHeader()
                          .AllowAnyMethod();
                });
            });
            builder.Services.AddSignalR();
            builder.Services.AddSingleton<IUserIdProvider, UserIdProvider>();
            builder.Services.AddAutoMapper(typeof(AppMapper).Assembly);
            builder.Services.AddMemoryCache();

            string issuer = builder.Configuration["Jwt:Issuer"];
            string audience = builder.Configuration["Jwt:Audience"];

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(o =>
            {
                o.RequireHttpsMetadata = false;
                o.SaveToken = true;
                o.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"].ToString();
                        var path = context.HttpContext?.Request.Path;

                        Console.WriteLine($"[E2E:Backend][OnMessageReceived] Path={path} AccessTokenPresent={!string.IsNullOrEmpty(accessToken)}");

                        if (!string.IsNullOrEmpty(accessToken) &&
                            path.HasValue &&
                            path.Value.Equals("/chatHub", StringComparison.OrdinalIgnoreCase))
                        {
                            context.Token = accessToken;
                            Console.WriteLine("[E2E:Backend][OnMessageReceived] Access token forwarded to JWT auth for SignalR /chatHub");
                        }

                        return System.Threading.Tasks.Task.CompletedTask;
                    },
                    OnTokenValidated = context =>
                    {
                        var path = context.Request.HttpContext?.Request.Path;
                        var userId = context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? context.Principal?.FindFirst("UserId")?.Value ?? "unknown";
                        Console.WriteLine($"[E2E:Backend][TokenValidated] Path={path} UserId={userId}");
                        return System.Threading.Tasks.Task.CompletedTask;
                    },
                    OnAuthenticationFailed = context =>
                    {
                        var path = context.Request.HttpContext?.Request.Path;
                        Console.WriteLine($"[E2E:Backend][AuthFailed] Path={path} Error={context.Exception?.Message}");
                        return System.Threading.Tasks.Task.CompletedTask;
                    }
                };

                o.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidIssuer = issuer,
                    ValidAudience = audience,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"])
                    ),
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = false,
                    ValidateIssuerSigningKey = true,
                    NameClaimType = ClaimTypes.NameIdentifier
                };
            });

            builder.Services.AddAuthorization();

            await builder.Services.ApplyPendingMigrationsAsync();
            await builder.Services.SeedDataAsync();

            var app = builder.Build();

            if (!app.Environment.IsProduction())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
                Console.WriteLine("[E2E:Backend] HTTPS redirection disabled for non-production environment.");
            }
            else
            {
                app.UseHttpsRedirection();
            }

            app.UseStaticFiles();
            app.UseCors();
            app.UseAuthentication();
            app.UseAuthorization();
            app.MapControllers();
            app.MapHub<ChatHub>("/chatHub");
            Console.WriteLine("[E2E:Backend] SignalR ChatHub mapped to /chatHub");
            Console.WriteLine("[E2E:Backend] Web application is starting on http://*:5140");
            app.Run();
        }
    }

    public class UserIdProvider : IUserIdProvider
    {
        public string GetUserId(HubConnectionContext connection)
        {
            if (connection?.User == null)
                return null;

            return connection.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? connection.User.FindFirst("UserId")?.Value
                ?? connection.User.Identity?.Name;
        }
    }
}