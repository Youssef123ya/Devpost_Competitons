using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UXFriends.Domain.Entities
{
    public class Question
    {
        [Key]
        public string QuestionCode { get; set; } = string.Empty;
        
        [Required]
        public string QuizCode { get; set; } = string.Empty;
        
        [Required]
        public string QuestionText { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string QuestionType { get; set; } = "MultipleChoice"; // MultipleChoice, TrueFalse, etc.
        
        public string Options { get; set; } = string.Empty; // JSON array of options
        
        public string CorrectAnswer { get; set; } = string.Empty;
        
        public int Points { get; set; } = 1;
        
        public int OrderNo { get; set; }
        
        // Navigation Properties
        [ForeignKey(nameof(QuizCode))]
        public Quiz Quiz { get; set; } = null!;
    }
}