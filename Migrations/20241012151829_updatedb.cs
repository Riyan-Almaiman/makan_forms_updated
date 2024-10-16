using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace forms_api.Migrations
{
    /// <inheritdoc />
    public partial class updatedb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
    

   

            migrationBuilder.AddColumn<int>(
                name: "ProductionRole",
                table: "WeeklyTargets",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ProductionRole",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Completion",
                table: "SheetLayerStatus",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "IsFinalQCInProgress",
                table: "SheetLayerStatus",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsFinalizedQCInProgress",
                table: "SheetLayerStatus",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ProductId",
                table: "SheetLayerStatus",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ProductionRole",
                table: "Forms",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Completion",
                table: "DailyTargets",
                type: "double",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsQC",
                table: "DailyTargets",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "SheetLayerStatusId",
                table: "DailyTargets",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_SheetLayerStatus_ProductId",
                table: "SheetLayerStatus",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_DailyTargets_SheetLayerStatusId",
                table: "DailyTargets",
                column: "SheetLayerStatusId");

            migrationBuilder.AddForeignKey(
                name: "FK_DailyTargets_SheetLayerStatus_SheetLayerStatusId",
                table: "DailyTargets",
                column: "SheetLayerStatusId",
                principalTable: "SheetLayerStatus",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SheetLayerStatus_Products_ProductId",
                table: "SheetLayerStatus",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DailyTargets_SheetLayerStatus_SheetLayerStatusId",
                table: "DailyTargets");

            migrationBuilder.DropForeignKey(
                name: "FK_SheetLayerStatus_Products_ProductId",
                table: "SheetLayerStatus");

            migrationBuilder.DropIndex(
                name: "IX_SheetLayerStatus_ProductId",
                table: "SheetLayerStatus");

            migrationBuilder.DropIndex(
                name: "IX_DailyTargets_SheetLayerStatusId",
                table: "DailyTargets");

            migrationBuilder.DropColumn(
                name: "ProductionRole",
                table: "WeeklyTargets");

            migrationBuilder.DropColumn(
                name: "ProductionRole",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Completion",
                table: "SheetLayerStatus");

            migrationBuilder.DropColumn(
                name: "IsFinalQCInProgress",
                table: "SheetLayerStatus");

            migrationBuilder.DropColumn(
                name: "IsFinalizedQCInProgress",
                table: "SheetLayerStatus");

            migrationBuilder.DropColumn(
                name: "ProductId",
                table: "SheetLayerStatus");

            migrationBuilder.DropColumn(
                name: "ProductionRole",
                table: "Forms");

            migrationBuilder.DropColumn(
                name: "Completion",
                table: "DailyTargets");

            migrationBuilder.DropColumn(
                name: "IsQC",
                table: "DailyTargets");

            migrationBuilder.DropColumn(
                name: "SheetLayerStatusId",
                table: "DailyTargets");

         

      
        }
    }
}
