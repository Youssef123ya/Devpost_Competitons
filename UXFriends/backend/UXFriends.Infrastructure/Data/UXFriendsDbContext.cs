using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using UXFriends.Domain.Entities;

namespace UXFriends.Infrastructure.Data
{
    public class UXFriendsDbContext : IdentityDbContext<User>
    {
        public UXFriendsDbContext(DbContextOptions<UXFriendsDbContext> options)
            : base(options)
        {
        }

        // Core Learning Entities
        public DbSet<Section> Sections { get; set; }
        public DbSet<Unit> Units { get; set; }
        public DbSet<Lesson> Lessons { get; set; }
        public DbSet<Quiz> Quizzes { get; set; }
        public DbSet<Question> Questions { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectSubmission> ProjectSubmissions { get; set; }
        public DbSet<Certificate> Certificates { get; set; }
        public DbSet<QuizAttempt> QuizAttempts { get; set; }
        public DbSet<QuizAttemptAnswer> QuizAttemptAnswers { get; set; }

        // Progress Tracking Entities
        public DbSet<LessonProgress> LessonProgress { get; set; }
        public DbSet<UserNote> UserNotes { get; set; }

        // Gamification Entities
        public DbSet<GamificationProfile> GamificationProfiles { get; set; }
        public DbSet<XPLog> XPLogs { get; set; }
        public DbSet<Badge> Badges { get; set; }
        public DbSet<UserBadge> UserBadges { get; set; }
        public DbSet<Challenge> Challenges { get; set; }
        public DbSet<UserChallenge> UserChallenges { get; set; }
        public DbSet<LeaderboardEntry> LeaderboardEntries { get; set; }
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
        public DbSet<EmailVerificationToken> EmailVerificationTokens { get; set; }
        public DbSet<AIChatSession> AIChatSessions { get; set; }

        // AI Entities
        // public DbSet<AIAgent> AIAgents { get; set; }
        // public DbSet<AIReport> AIReports { get; set; }

        

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            ApplyUtcDateTimeConverters(modelBuilder);

            // Configure relationships and constraints

            // Section -> Units (One-to-Many)
            modelBuilder.Entity<Unit>()
                .HasOne(u => u.Section)
                .WithMany(s => s.Units)
                .HasForeignKey(u => u.SectionCode)
                .OnDelete(DeleteBehavior.Cascade);

            // Unit -> Lessons (One-to-Many)
            modelBuilder.Entity<Lesson>()
                .HasOne(l => l.Unit)
                .WithMany(u => u.Lessons)
                .HasForeignKey(l => l.UnitCode)
                .OnDelete(DeleteBehavior.Cascade);

            // User -> GamificationProfile (One-to-One)
            modelBuilder.Entity<GamificationProfile>()
                .HasOne(g => g.User)
                .WithOne(u => u.GamificationProfile)
                .HasForeignKey<GamificationProfile>(g => g.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // User -> LessonProgress (One-to-Many)
            modelBuilder.Entity<LessonProgress>()
                .HasOne(lp => lp.User)
                .WithMany(u => u.LessonProgress)
                .HasForeignKey(lp => lp.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Lesson -> LessonProgress (One-to-Many)
            modelBuilder.Entity<LessonProgress>()
                .HasOne(lp => lp.Lesson)
                .WithMany(l => l.ProgressRecords)
                .HasForeignKey(lp => lp.LessonCode)
                .OnDelete(DeleteBehavior.NoAction);

            // User -> UserNote (One-to-Many)
            modelBuilder.Entity<UserNote>()
                .HasOne(un => un.User)
                .WithMany(u => u.Notes)
                .HasForeignKey(un => un.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Lesson -> UserNote (One-to-Many)
            modelBuilder.Entity<UserNote>()
                .HasOne(un => un.Lesson)
                .WithMany(l => l.Notes)
                .HasForeignKey(un => un.LessonCode)
                .OnDelete(DeleteBehavior.NoAction);

            // User -> Certificate (One-to-Many)
            modelBuilder.Entity<Certificate>()
                .HasOne(c => c.User)
                .WithMany(u => u.Certificates)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Section -> Certificate (One-to-Many)
            modelBuilder.Entity<Certificate>()
                .HasOne(c => c.Section)
                .WithMany(s => s.Certificates)
                .HasForeignKey(c => c.SectionCode)
                .OnDelete(DeleteBehavior.NoAction);

            // User -> UserBadge (One-to-Many)
            modelBuilder.Entity<UserBadge>()
                .HasOne(ub => ub.User)
                .WithMany(u => u.Badges)
                .HasForeignKey(ub => ub.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Badge -> UserBadge (One-to-Many)
            modelBuilder.Entity<UserBadge>()
                .HasOne(ub => ub.Badge)
                .WithMany(b => b.UserBadges)
                .HasForeignKey(ub => ub.BadgeCode)
                .OnDelete(DeleteBehavior.Cascade);

            // User -> XPLog (One-to-Many)
            modelBuilder.Entity<XPLog>()
                .HasOne(xl => xl.User)
                .WithMany(u => u.XPLogs)
                .HasForeignKey(xl => xl.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // User -> QuizAttempt (One-to-Many)
            modelBuilder.Entity<QuizAttempt>()
                .HasOne(qa => qa.User)
                .WithMany(u => u.QuizAttempts)
                .HasForeignKey(qa => qa.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // QuizAttempt -> QuizAttemptAnswer (One-to-Many)
            modelBuilder.Entity<QuizAttemptAnswer>()
                .HasOne(answer => answer.Attempt)
                .WithMany(attempt => attempt.Answers)
                .HasForeignKey(answer => answer.AttemptCode)
                .OnDelete(DeleteBehavior.Cascade);

            // User -> UserChallenge (One-to-Many)
            modelBuilder.Entity<UserChallenge>()
                .HasOne(uc => uc.User)
                .WithMany(u => u.Challenges)
                .HasForeignKey(uc => uc.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Challenge -> UserChallenge (One-to-Many)
            modelBuilder.Entity<UserChallenge>()
                .HasOne(uc => uc.Challenge)
                .WithMany(c => c.UserChallenges)
                .HasForeignKey(uc => uc.ChallengeCode)
                .OnDelete(DeleteBehavior.Cascade);

            // User -> LeaderboardEntry (One-to-Many)
            modelBuilder.Entity<LeaderboardEntry>()
                .HasOne(le => le.User)
                .WithMany(u => u.LeaderboardEntries)
                .HasForeignKey(le => le.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Quiz -> Question (One-to-Many)
            modelBuilder.Entity<Question>()
                .HasOne(q => q.Quiz)
                .WithMany(qz => qz.Questions)
                .HasForeignKey(q => q.QuizCode)
                .OnDelete(DeleteBehavior.Cascade);

            // Section -> Project (One-to-Many)
            modelBuilder.Entity<Project>()
                .HasOne(p => p.Section)
                .WithMany(s => s.Projects)
                .HasForeignKey(p => p.SectionCode)
                .OnDelete(DeleteBehavior.Cascade);

            // Project -> ProjectSubmission (One-to-Many)
            modelBuilder.Entity<ProjectSubmission>()
                .HasOne(ps => ps.Project)
                .WithMany(p => p.Submissions)
                .HasForeignKey(ps => ps.ProjectCode)
                .OnDelete(DeleteBehavior.Cascade);

            // User -> ProjectSubmission (One-to-Many)
            modelBuilder.Entity<ProjectSubmission>()
                .HasOne(ps => ps.User)
                .WithMany()
                .HasForeignKey(ps => ps.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            // User -> AIReport (One-to-Many)
            // modelBuilder.Entity<AIReport>()
            //     .HasOne(ar => ar.User)
            //     .WithMany(u => u.AIReports)
            //     .HasForeignKey(ar => ar.UserId)
            //     .OnDelete(DeleteBehavior.Cascade);

            // AIAgent -> AIReport (One-to-Many)
            // modelBuilder.Entity<AIReport>()
            //     .HasOne(ar => ar.Agent)
            //     .WithMany(a => a.Reports)
            //     .HasForeignKey(ar => ar.AgentId)
            //     .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PasswordResetToken>(entity =>
            {
                entity.HasOne(t => t.User)
                    .WithMany()
                    .HasForeignKey(t => t.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(t => new { t.UserId, t.Code, t.IsUsed });
            });

            modelBuilder.Entity<EmailVerificationToken>(entity =>
            {
                entity.HasOne(t => t.User)
                    .WithMany()
                    .HasForeignKey(t => t.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(t => new { t.UserId, t.TokenHash, t.IsUsed });
            });

            modelBuilder.Entity<AIChatSession>(entity =>
            {
                entity.HasOne(session => session.User)
                    .WithMany()
                    .HasForeignKey(session => session.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(session => session.UserId)
                    .IsUnique();
            });

            // Indexes for performance
            modelBuilder.Entity<LessonProgress>()
                .HasIndex(lp => new { lp.UserId, lp.LessonCode })
                .IsUnique();

            modelBuilder.Entity<UserBadge>()
                .HasIndex(ub => new { ub.UserId, ub.BadgeCode })
                .IsUnique();

            modelBuilder.Entity<UserChallenge>()
                .HasIndex(uc => new { uc.UserId, uc.ChallengeCode, uc.CycleKey })
                .IsUnique();

            modelBuilder.Entity<LeaderboardEntry>()
                .HasIndex(le => new { le.WeekStartDate, le.Rank });

            modelBuilder.Entity<QuizAttempt>()
                .HasIndex(attempt => new { attempt.UserId, attempt.SubmittedAt });

            modelBuilder.Entity<QuizAttempt>()
                .HasIndex(attempt => new { attempt.UserId, attempt.Scope, attempt.SectionCode });

            modelBuilder.Entity<QuizAttemptAnswer>()
                .HasIndex(answer => new { answer.AttemptCode, answer.QuestionCode });

            modelBuilder.Entity<Section>()
                .HasIndex(s => s.OrderNo);

            modelBuilder.Entity<Unit>()
                .HasIndex(u => new { u.SectionCode, u.OrderNo });

            modelBuilder.Entity<Lesson>()
                .HasIndex(l => new { l.UnitCode, l.OrderNo });
        }

        private static void ApplyUtcDateTimeConverters(ModelBuilder modelBuilder)
        {
            var utcConverter = new ValueConverter<DateTime, DateTime>(
                value => value.Kind == DateTimeKind.Utc ? value : value.ToUniversalTime(),
                value => DateTime.SpecifyKind(value, DateTimeKind.Utc));

            var nullableUtcConverter = new ValueConverter<DateTime?, DateTime?>(
                value => value.HasValue
                    ? (value.Value.Kind == DateTimeKind.Utc
                        ? value.Value
                        : value.Value.ToUniversalTime())
                    : value,
                value => value.HasValue
                    ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc)
                    : value);

            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                foreach (var property in entityType.GetProperties())
                {
                    if (property.ClrType == typeof(DateTime))
                    {
                        property.SetValueConverter(utcConverter);
                    }
                    else if (property.ClrType == typeof(DateTime?))
                    {
                        property.SetValueConverter(nullableUtcConverter);
                    }
                }
            }
        }
    }
}
