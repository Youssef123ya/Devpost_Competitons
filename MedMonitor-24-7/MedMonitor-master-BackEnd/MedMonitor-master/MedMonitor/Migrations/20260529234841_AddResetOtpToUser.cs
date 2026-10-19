using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedMonitor.Migrations
{
    /// <inheritdoc />
    public partial class AddResetOtpToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "OtpExpiry",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResetOtp",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OtpExpiry",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "ResetOtp",
                table: "AspNetUsers");
        }
    }
}
