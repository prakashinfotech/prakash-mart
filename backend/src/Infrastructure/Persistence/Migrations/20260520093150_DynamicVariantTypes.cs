using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrakashMart.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DynamicVariantTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Color",
                table: "ProductVariants");

            migrationBuilder.DropColumn(
                name: "Size",
                table: "ProductVariants");

            migrationBuilder.AddColumn<string>(
                name: "Attributes",
                table: "ProductVariants",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "VariantTypes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DisplayType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SuggestedOptions = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VariantTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CategoryVariantTypes",
                columns: table => new
                {
                    CategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VariantTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsRequired = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CategoryVariantTypes", x => new { x.CategoryId, x.VariantTypeId });
                    table.ForeignKey(
                        name: "FK_CategoryVariantTypes_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CategoryVariantTypes_VariantTypes_VariantTypeId",
                        column: x => x.VariantTypeId,
                        principalTable: "VariantTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CategoryVariantTypes_VariantTypeId",
                table: "CategoryVariantTypes",
                column: "VariantTypeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CategoryVariantTypes");

            migrationBuilder.DropTable(
                name: "VariantTypes");

            migrationBuilder.DropColumn(
                name: "Attributes",
                table: "ProductVariants");

            migrationBuilder.AddColumn<string>(
                name: "Color",
                table: "ProductVariants",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Size",
                table: "ProductVariants",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
