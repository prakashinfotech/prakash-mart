using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrakashMart.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCartReservations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CartReservations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductVariantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsReleased = table.Column<bool>(type: "bit", nullable: false),
                    ReleasedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CartReservations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CartReservations_ProductVariants_ProductVariantId",
                        column: x => x.ProductVariantId,
                        principalTable: "ProductVariants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CartReservations_IsReleased_ExpiresAt",
                table: "CartReservations",
                columns: new[] { "IsReleased", "ExpiresAt" });

            migrationBuilder.CreateIndex(
                name: "IX_CartReservations_ProductVariantId",
                table: "CartReservations",
                column: "ProductVariantId");

            migrationBuilder.CreateIndex(
                name: "IX_CartReservations_UserId",
                table: "CartReservations",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CartReservations");
        }
    }
}
