using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace UXFriends.Domain.Entities
{
    public class User : IdentityUser
    {
        [Required]
        [MaxLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string LastName { get; set; } = string.Empty;

        // Profile & Progress
        public int Level { get; set; } = 1;
        public int TotalXP { get; set; } = 0;
        public int CurrentXP { get; set; } = 0;
        public int NextLevelXP { get; set; } = 1000;
        public int CurrentStreak { get; set; } = 0;
        public int LongestStreak { get; set; } = 0;
        public int Coins { get; set; } = 0;
        public int LessonsCompleted { get; set; } = 0;
        public int ProjectsCompleted { get; set; } = 0;
        public int ChallengesWon { get; set; } = 0;
        public string? Avatar { get; set; }

        [MaxLength(120)]
        public string? ProfessionalTitle { get; set; }

        [MaxLength(800)]
        public string? Bio { get; set; }

        [MaxLength(120)]
        public string? Location { get; set; }

        [MaxLength(200)]
        public string? Website { get; set; }
        
        [MaxLength(20)]
        public string PortfolioVisibility { get; set; } = "private";

        [MaxLength(120)]
        public string PortfolioSlug { get; set; } = string.Empty;

        [MaxLength(120)]
        public string PortfolioAccessKey { get; set; } = string.Empty;

        // ✅ Onboarding Data - THIS IS WHAT WE'RE ADDING
        public bool HasCompletedOnboarding { get; set; } = false;
        
        [MaxLength(50)]
        public string? LearningGoal { get; set; }  // "basics", "ui", "ux", "career"
        
        [MaxLength(50)]
        public string? SkillLevel { get; set; }    // "beginner", "intermediate", "advanced"
        
        public int? WeeklyDays { get; set; }       // 3, 5, or 7
        
        public int? DailyMinutes { get; set; }     // 15, 30, or 60

        [MaxLength(2)]
        public string PreferredLanguage { get; set; } = "ar";

        [MaxLength(20)]
        public string LeagueTier { get; set; } = "bronze";

        [MaxLength(20)]
        public string LeagueSkillLevel { get; set; } = "beginner";

        [MaxLength(16)]
        public string LeagueWeekKey { get; set; } = string.Empty;

        [MaxLength(16)]
        public string LastLeagueResultWeekKey { get; set; } = string.Empty;

        public int? LastLeagueResultRank { get; set; }

        public int LastLeagueResultRewardXp { get; set; } = 0;

        [MaxLength(20)]
        public string LastLeagueResultTier { get; set; } = string.Empty;

        [MaxLength(20)]
        public string LastLeagueResultSkillLevel { get; set; } = string.Empty;

        [MaxLength(20)]
        public string LastLeagueResultMovement { get; set; } = string.Empty;

        public DateTime? LastLeagueResultSettledAt { get; set; }

        // Timestamps
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastLoginAt { get; set; }
        public DateTime? OnboardingCompletedAt { get; set; }

        // Navigation Properties - matching YOUR DbContext names exactly
        public virtual ICollection<LessonProgress>? LessonProgress { get; set; }
        public virtual ICollection<Project>? Projects { get; set; }
        public virtual ICollection<Certificate>? Certificates { get; set; }
        public virtual ICollection<UserBadge>? Badges { get; set; }
        public virtual ICollection<UserChallenge>? Challenges { get; set; }
        public virtual ICollection<UserNote>? Notes { get; set; }
        public virtual ICollection<XPLog>? XPLogs { get; set; }
        public virtual ICollection<QuizAttempt>? QuizAttempts { get; set; }
        public virtual GamificationProfile? GamificationProfile { get; set; }
        public virtual ICollection<LeaderboardEntry>? LeaderboardEntries { get; set; }
        
        // ❌ REMOVED AIReports - comment it out in your DbContext if it causes issues
        // public virtual ICollection<AIReport>? AIReports { get; set; }
    }
}
