using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartKitchen.API.Migrations
{
    /// <inheritdoc />
    public partial class AddLedColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Fan",
                table: "SensorReadings",
                newName: "LED");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "LED",
                table: "SensorReadings",
                newName: "Fan");
        }
    }
}
