using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartKitchen.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSensorHardwareStatuses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Basket",
                table: "SensorReadings",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "CLOSED");

            migrationBuilder.AddColumn<string>(
                name: "BuzzerState",
                table: "SensorReadings",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "OFF");

            migrationBuilder.AddColumn<string>(
                name: "Fan",
                table: "SensorReadings",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "OFF");

            migrationBuilder.AddColumn<string>(
                name: "GasValve",
                table: "SensorReadings",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "CLOSED");

            migrationBuilder.AddColumn<string>(
                name: "Hand",
                table: "SensorReadings",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "NO");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Basket",
                table: "SensorReadings");

            migrationBuilder.DropColumn(
                name: "BuzzerState",
                table: "SensorReadings");

            migrationBuilder.DropColumn(
                name: "Fan",
                table: "SensorReadings");

            migrationBuilder.DropColumn(
                name: "GasValve",
                table: "SensorReadings");

            migrationBuilder.DropColumn(
                name: "Hand",
                table: "SensorReadings");
        }
    }
}
