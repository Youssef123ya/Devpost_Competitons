using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UXFriends.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddChallengeCycleFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserChallenges_UserId_ChallengeCode",
                table: "UserChallenges");

            migrationBuilder.AddColumn<string>(
                name: "CycleKey",
                table: "UserChallenges",
                type: "TEXT",
                maxLength: 64,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "ExpiresAt",
                table: "UserChallenges",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserChallenges_UserId_ChallengeCode_CycleKey",
                table: "UserChallenges",
                columns: new[] { "UserId", "ChallengeCode", "CycleKey" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserChallenges_UserId_ChallengeCode_CycleKey",
                table: "UserChallenges");

            migrationBuilder.DropColumn(
                name: "CycleKey",
                table: "UserChallenges");

            migrationBuilder.DropColumn(
                name: "ExpiresAt",
                table: "UserChallenges");

            migrationBuilder.CreateIndex(
                name: "IX_UserChallenges_UserId_ChallengeCode",
                table: "UserChallenges",
                columns: new[] { "UserId", "ChallengeCode" },
                unique: true);
        }
    }
}
