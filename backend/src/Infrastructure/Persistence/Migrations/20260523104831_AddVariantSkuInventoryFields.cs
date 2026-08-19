using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrakashMart.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddVariantSkuInventoryFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Barcode",
                table: "ProductVariants",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReservedQuantity",
                table: "ProductVariants",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "ProductVariants",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<string>(
                name: "SKU",
                table: "ProductVariants",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            // Backfill SKUs for existing rows using the same format as ProductVariant.Create():
            // "VAR-" + first 8 chars of the Id GUID (no dashes, uppercase)
            migrationBuilder.Sql(
                "UPDATE ProductVariants " +
                "SET SKU = 'VAR-' + UPPER(LEFT(REPLACE(CONVERT(NVARCHAR(36), Id), '-', ''), 8)) " +
                "WHERE SKU = ''");

            migrationBuilder.CreateIndex(
                name: "UX_ProductVariants_SKU",
                table: "ProductVariants",
                column: "SKU",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UX_ProductVariants_SKU",
                table: "ProductVariants");

            migrationBuilder.DropColumn(
                name: "Barcode",
                table: "ProductVariants");

            migrationBuilder.DropColumn(
                name: "ReservedQuantity",
                table: "ProductVariants");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "ProductVariants");

            migrationBuilder.DropColumn(
                name: "SKU",
                table: "ProductVariants");
        }
    }
}
