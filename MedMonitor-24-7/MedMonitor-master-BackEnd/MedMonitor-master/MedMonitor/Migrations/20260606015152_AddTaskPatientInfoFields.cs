using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedMonitor.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskPatientInfoFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NurseName",
                table: "Tasks",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PatientName",
                table: "Tasks",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Remind",
                table: "Tasks",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Repeat",
                table: "Tasks",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NurseName",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "PatientName",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "Remind",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "Repeat",
                table: "Tasks");
        }
    }
}
