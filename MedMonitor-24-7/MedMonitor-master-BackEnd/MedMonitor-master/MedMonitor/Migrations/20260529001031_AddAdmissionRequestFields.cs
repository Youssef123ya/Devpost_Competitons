using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedMonitor.Migrations
{
    /// <inheritdoc />
    public partial class AddAdmissionRequestFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CompanionPhone",
                table: "AdmissionRequests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Gender",
                table: "AdmissionRequests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Height",
                table: "AdmissionRequests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Illness",
                table: "AdmissionRequests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NurseName",
                table: "AdmissionRequests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PatientId",
                table: "AdmissionRequests",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompanionPhone",
                table: "AdmissionRequests");

            migrationBuilder.DropColumn(
                name: "Gender",
                table: "AdmissionRequests");

            migrationBuilder.DropColumn(
                name: "Height",
                table: "AdmissionRequests");

            migrationBuilder.DropColumn(
                name: "Illness",
                table: "AdmissionRequests");

            migrationBuilder.DropColumn(
                name: "NurseName",
                table: "AdmissionRequests");

            migrationBuilder.DropColumn(
                name: "PatientId",
                table: "AdmissionRequests");
        }
    }
}
