using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace PrakashMart.Infrastructure.Persistence.Repositories;

public class ProductVariantRepository(AppDbContext context) : IProductVariantRepository
{
    public async Task<IEnumerable<ProductVariant>> GetByProductIdAsync(Guid productId)
        => await context.ProductVariants
            .Where(v => v.ProductId == productId)
            .OrderBy(v => v.CreatedAt)
            .ToListAsync();

    public async Task<ProductVariant?> GetByIdAsync(Guid id)
        => await context.ProductVariants.FindAsync(id);

    public async Task<ProductVariant?> GetBySkuAsync(string sku)
        => await context.ProductVariants
            .FirstOrDefaultAsync(v => v.SKU == sku.Trim().ToUpperInvariant());

    public async Task AddAsync(ProductVariant variant) => await context.ProductVariants.AddAsync(variant);

    public void Update(ProductVariant variant) => context.ProductVariants.Update(variant);

    public void Delete(ProductVariant variant) => context.ProductVariants.Remove(variant);

    // Single SQL statement — atomic at DB engine level. No EF change-tracking involved.
    // The WHERE clause (Stock - ReservedQuantity) >= qty prevents negative available stock.
    public async Task<bool> AtomicDeductStockAsync(Guid variantId, int quantity)
    {
        var rows = await context.Database.ExecuteSqlRawAsync(
            "UPDATE ProductVariants SET Stock = Stock - {0}, UpdatedAt = SYSUTCDATETIME() " +
            "WHERE Id = {1} AND IsActive = 1 AND (Stock - ReservedQuantity) >= {0}",
            quantity, variantId);
        return rows == 1;
    }

    // Restores stock after order cancellation — caps are enforced by business logic before calling.
    public async Task RestoreStockAsync(Guid variantId, int quantity)
    {
        await context.Database.ExecuteSqlRawAsync(
            "UPDATE ProductVariants SET Stock = Stock + {0}, UpdatedAt = SYSUTCDATETIME() " +
            "WHERE Id = {1}",
            quantity, variantId);
    }

    public async Task<IEnumerable<ProductVariant>> GetActiveBySellerIdAsync(Guid sellerId)
        => await context.ProductVariants
            .Include(v => v.Product)
            .Where(v => v.IsActive && v.Product!.SellerId == sellerId && v.Product.IsActive)
            .ToListAsync();

    public async Task<IEnumerable<ProductVariant>> GetAllActiveAsync(int limit = 500)
        => await context.ProductVariants
            .Include(v => v.Product)
            .Where(v => v.IsActive && v.Product!.IsActive)
            .Take(limit)
            .ToListAsync();

    // Deducts stock AND releases reservation atomically.
    // Checks Stock >= qty (not AvailableStock) — valid because the caller holds a reservation.
    public async Task<bool> AtomicDeductWithReservationAsync(Guid variantId, int quantity)
    {
        var rows = await context.Database.ExecuteSqlRawAsync(
            "UPDATE ProductVariants " +
            "SET Stock = Stock - {0}, " +
            "    ReservedQuantity = CASE WHEN ReservedQuantity >= {0} THEN ReservedQuantity - {0} ELSE 0 END, " +
            "    UpdatedAt = SYSUTCDATETIME() " +
            "WHERE Id = {1} AND IsActive = 1 AND Stock >= {0}",
            quantity, variantId);
        return rows == 1;
    }

    // Atomically increments ReservedQuantity WHERE AvailableStock >= qty.
    public async Task<bool> AtomicReserveAsync(Guid variantId, int quantity)
    {
        var rows = await context.Database.ExecuteSqlRawAsync(
            "UPDATE ProductVariants SET ReservedQuantity = ReservedQuantity + {0}, UpdatedAt = SYSUTCDATETIME() " +
            "WHERE Id = {1} AND IsActive = 1 AND (Stock - ReservedQuantity) >= {0}",
            quantity, variantId);
        return rows == 1;
    }

    // Decrements ReservedQuantity, clamped to 0 to prevent negative values.
    public async Task AtomicReleaseReservationAsync(Guid variantId, int quantity)
    {
        await context.Database.ExecuteSqlRawAsync(
            "UPDATE ProductVariants " +
            "SET ReservedQuantity = CASE WHEN ReservedQuantity >= {0} THEN ReservedQuantity - {0} ELSE 0 END, " +
            "UpdatedAt = SYSUTCDATETIME() " +
            "WHERE Id = {1}",
            quantity, variantId);
    }
}
