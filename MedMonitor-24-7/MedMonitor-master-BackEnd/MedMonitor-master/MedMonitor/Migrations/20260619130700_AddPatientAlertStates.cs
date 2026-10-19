using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedMonitor.Migrations
{
    public partial class AddPatientAlertStates : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PatientAlertStates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PatientId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsAlertActive = table.Column<bool>(type: "bit", nullable: false),
                    LastAlertLevel = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LastAlertSentAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PatientAlertStates", x => x.Id);
                });

            migrationBuilder.AddColumn<string>(
                name: "AlertLevel",
                table: "Notifications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UnitName",
                table: "Notifications",
                type: "nvarchar(max)",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AlertLevel",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "UnitName",
                table: "Notifications");

            migrationBuilder.DropTable(
                name: "PatientAlertStates");
        }
    }
}
