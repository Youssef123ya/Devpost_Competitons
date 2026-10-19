using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UXFriends.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAiChatSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AIChatSessions",
                columns: table => new
                {
                    SessionCode = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    MessagesJson = table.Column<string>(type: "TEXT", nullable: false),
                    ContextSnapshotJson = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AIChatSessions", x => x.SessionCode);
                    table.ForeignKey(
                        name: "FK_AIChatSessions_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AIChatSessions_UserId",
                table: "AIChatSessions",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AIChatSessions");
        }
    }
}
