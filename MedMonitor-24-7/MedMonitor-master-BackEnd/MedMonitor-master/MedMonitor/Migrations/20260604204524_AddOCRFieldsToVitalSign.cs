using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedMonitor.Migrations
{
    /// <inheritdoc />
    public partial class AddOCRFieldsToVitalSign : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EtCO2",
                table: "VitalSigns",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Pulse",
                table: "VitalSigns",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RespiratoryRate",
                table: "VitalSigns",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SpO2",
                table: "VitalSigns",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CompanionPhone",
                table: "Beds",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Diagnosis",
                table: "Beds",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Gender",
                table: "Beds",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Height",
                table: "Beds",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MedicalHistory",
                table: "Beds",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PatientId",
                table: "Beds",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Weight",
                table: "Beds",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EtCO2",
                table: "VitalSigns");

            migrationBuilder.DropColumn(
                name: "Pulse",
                table: "VitalSigns");

            migrationBuilder.DropColumn(
                name: "RespiratoryRate",
                table: "VitalSigns");

            migrationBuilder.DropColumn(
                name: "SpO2",
                table: "VitalSigns");

            migrationBuilder.DropColumn(
                name: "CompanionPhone",
                table: "Beds");

            migrationBuilder.DropColumn(
                name: "Diagnosis",
                table: "Beds");

            migrationBuilder.DropColumn(
                name: "Gender",
                table: "Beds");

            migrationBuilder.DropColumn(
                name: "Height",
                table: "Beds");

            migrationBuilder.DropColumn(
                name: "MedicalHistory",
                table: "Beds");

            migrationBuilder.DropColumn(
                name: "PatientId",
                table: "Beds");

            migrationBuilder.DropColumn(
                name: "Weight",
                table: "Beds");
        }
    }
}
