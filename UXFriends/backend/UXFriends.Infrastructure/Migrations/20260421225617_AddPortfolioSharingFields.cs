using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UXFriends.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPortfolioSharingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PortfolioAccessKey",
                table: "AspNetUsers",
                type: "TEXT",
                maxLength: 120,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PortfolioSlug",
                table: "AspNetUsers",
                type: "TEXT",
                maxLength: 120,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PortfolioVisibility",
                table: "AspNetUsers",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "link-only");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PortfolioAccessKey",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "PortfolioSlug",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "PortfolioVisibility",
                table: "AspNetUsers");
        }
    }
}
