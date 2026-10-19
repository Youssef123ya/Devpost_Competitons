using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UXFriends.Domain.Entities
{
    public class QuizAttempt
    {
        [Key]
        public string AttemptCode { get; set; } = string.Empty;

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        [MaxLength(120)]
        public string QuizCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(40)]
        public string Scope { get; set; } = string.Empty;

        [MaxLength(120)]
        public string? SectionCode { get; set; }

        [MaxLength(120)]
        public string? UnitCode { get; set; }

        [MaxLength(120)]
        public string? LessonCode { get; set; }

        public int ScorePercent { get; set; }

        public int CorrectAnswers { get; set; }

        public int TotalQuestions { get; set; }

        public bool Passed { get; set; }

        public int? TimeLimitMinutes { get; set; }

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;

        public ICollection<QuizAttemptAnswer> Answers { get; set; } = new List<QuizAttemptAnswer>();
    }

    public class QuizAttemptAnswer
    {
        [Key]
        public int AnswerId { get; set; }

        [Required]
        public string AttemptCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(120)]
        public string QuestionCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string QuestionType { get; set; } = "single";

        [Required]
        public string PromptAr { get; set; } = string.Empty;

        [Required]
        public string PromptEn { get; set; } = string.Empty;

        public int? SelectedOptionIndex { get; set; }

        public int CorrectOptionIndex { get; set; }

        public bool IsCorrect { get; set; }

        public string? SelectedAnswerAr { get; set; }

        public string? SelectedAnswerEn { get; set; }

        public string CorrectAnswerAr { get; set; } = string.Empty;

        public string CorrectAnswerEn { get; set; } = string.Empty;

        public string ExplanationAr { get; set; } = string.Empty;

        public string ExplanationEn { get; set; } = string.Empty;

        [MaxLength(120)]
        public string? RelatedLessonCode { get; set; }

        [ForeignKey(nameof(AttemptCode))]
        public QuizAttempt Attempt { get; set; } = null!;
    }
}
