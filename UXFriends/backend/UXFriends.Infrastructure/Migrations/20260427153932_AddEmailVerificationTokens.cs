using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UXFriends.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailVerificationTokens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LastLeagueResultMovement",
                table: "AspNetUsers",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "LastLeagueResultRank",
                table: "AspNetUsers",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LastLeagueResultRewardXp",
                table: "AspNetUsers",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastLeagueResultSettledAt",
                table: "AspNetUsers",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastLeagueResultSkillLevel",
                table: "AspNetUsers",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LastLeagueResultTier",
                table: "AspNetUsers",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LastLeagueResultWeekKey",
                table: "AspNetUsers",
                type: "TEXT",
                maxLength: 16,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LeagueSkillLevel",
                table: "AspNetUsers",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LeagueTier",
                table: "AspNetUsers",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LeagueWeekKey",
                table: "AspNetUsers",
                type: "TEXT",
                maxLength: 16,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "EmailVerificationTokens",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    TokenHash = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IsUsed = table.Column<bool>(type: "INTEGER", nullable: false),
                    UsedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailVerificationTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmailVerificationTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EmailVerificationTokens_UserId_TokenHash_IsUsed",
                table: "EmailVerificationTokens",
                columns: new[] { "UserId", "TokenHash", "IsUsed" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EmailVerificationTokens");

            migrationBuilder.DropColumn(
                name: "LastLeagueResultMovement",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "LastLeagueResultRank",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "LastLeagueResultRewardXp",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "LastLeagueResultSettledAt",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "LastLeagueResultSkillLevel",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "LastLeagueResultTier",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "LastLeagueResultWeekKey",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "LeagueSkillLevel",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "LeagueTier",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "LeagueWeekKey",
                table: "AspNetUsers");
        }
    }
}
