using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedMonitor.Migrations
{
    /// <inheritdoc />
    public partial class AddPatientInfoToBed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Beds_AspNetUsers_PatientId",
                table: "Beds");

            migrationBuilder.DropIndex(
                name: "IX_Beds_PatientId",
                table: "Beds");

            migrationBuilder.DropColumn(
                name: "PatientId",
                table: "Beds");

            migrationBuilder.AddColumn<string>(
                name: "NurseName",
                table: "Beds",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PatientAge",
                table: "Beds",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PatientIllness",
                table: "Beds",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PatientName",
                table: "Beds",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NurseName",
                table: "Beds");

            migrationBuilder.DropColumn(
                name: "PatientAge",
                table: "Beds");

            migrationBuilder.DropColumn(
                name: "PatientIllness",
                table: "Beds");

            migrationBuilder.DropColumn(
                name: "PatientName",
                table: "Beds");

            migrationBuilder.AddColumn<string>(
                name: "PatientId",
                table: "Beds",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Beds_PatientId",
                table: "Beds",
                column: "PatientId");

            migrationBuilder.AddForeignKey(
                name: "FK_Beds_AspNetUsers_PatientId",
                table: "Beds",
                column: "PatientId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
