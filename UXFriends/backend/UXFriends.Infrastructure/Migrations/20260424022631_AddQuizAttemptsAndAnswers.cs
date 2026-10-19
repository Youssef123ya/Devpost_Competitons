using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UXFriends.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddQuizAttemptsAndAnswers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "QuizAttempts",
                columns: table => new
                {
                    AttemptCode = table.Column<string>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    QuizCode = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    Scope = table.Column<string>(type: "TEXT", maxLength: 40, nullable: false),
                    SectionCode = table.Column<string>(type: "TEXT", maxLength: 120, nullable: true),
                    UnitCode = table.Column<string>(type: "TEXT", maxLength: 120, nullable: true),
                    LessonCode = table.Column<string>(type: "TEXT", maxLength: 120, nullable: true),
                    ScorePercent = table.Column<int>(type: "INTEGER", nullable: false),
                    CorrectAnswers = table.Column<int>(type: "INTEGER", nullable: false),
                    TotalQuestions = table.Column<int>(type: "INTEGER", nullable: false),
                    Passed = table.Column<bool>(type: "INTEGER", nullable: false),
                    TimeLimitMinutes = table.Column<int>(type: "INTEGER", nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuizAttempts", x => x.AttemptCode);
                    table.ForeignKey(
                        name: "FK_QuizAttempts_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QuizAttemptAnswers",
                columns: table => new
                {
                    AnswerId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    AttemptCode = table.Column<string>(type: "TEXT", nullable: false),
                    QuestionCode = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    QuestionType = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    PromptAr = table.Column<string>(type: "TEXT", nullable: false),
                    PromptEn = table.Column<string>(type: "TEXT", nullable: false),
                    SelectedOptionIndex = table.Column<int>(type: "INTEGER", nullable: true),
                    CorrectOptionIndex = table.Column<int>(type: "INTEGER", nullable: false),
                    IsCorrect = table.Column<bool>(type: "INTEGER", nullable: false),
                    SelectedAnswerAr = table.Column<string>(type: "TEXT", nullable: true),
                    SelectedAnswerEn = table.Column<string>(type: "TEXT", nullable: true),
                    CorrectAnswerAr = table.Column<string>(type: "TEXT", nullable: false),
                    CorrectAnswerEn = table.Column<string>(type: "TEXT", nullable: false),
                    ExplanationAr = table.Column<string>(type: "TEXT", nullable: false),
                    ExplanationEn = table.Column<string>(type: "TEXT", nullable: false),
                    RelatedLessonCode = table.Column<string>(type: "TEXT", maxLength: 120, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuizAttemptAnswers", x => x.AnswerId);
                    table.ForeignKey(
                        name: "FK_QuizAttemptAnswers_QuizAttempts_AttemptCode",
                        column: x => x.AttemptCode,
                        principalTable: "QuizAttempts",
                        principalColumn: "AttemptCode",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_QuizAttemptAnswers_AttemptCode_QuestionCode",
                table: "QuizAttemptAnswers",
                columns: new[] { "AttemptCode", "QuestionCode" });

            migrationBuilder.CreateIndex(
                name: "IX_QuizAttempts_UserId_Scope_SectionCode",
                table: "QuizAttempts",
                columns: new[] { "UserId", "Scope", "SectionCode" });

            migrationBuilder.CreateIndex(
                name: "IX_QuizAttempts_UserId_SubmittedAt",
                table: "QuizAttempts",
                columns: new[] { "UserId", "SubmittedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "QuizAttemptAnswers");

            migrationBuilder.DropTable(
                name: "QuizAttempts");
        }
    }
}
