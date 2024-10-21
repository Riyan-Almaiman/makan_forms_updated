using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace forms_api.Migrations
{
    /// <inheritdoc />
    public partial class deliverynumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DeliveryNumber",
                table: "SheetLayerStatus",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeliveryNumber",
                table: "SheetLayerStatus");
        }
    }
}
