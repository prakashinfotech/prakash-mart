using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace PrakashMart.Infrastructure.Persistence.Repositories;

public class InventoryTransactionRepository(AppDbContext db) : IInventoryTransactionRepository
{
    public async Task AddAsync(InventoryTransaction transaction)
        => await db.InventoryTransactions.AddAsync(transaction);

    public async Task<IEnumerable<InventoryTransaction>> GetByVariantIdAsync(Guid variantId, int limit = 50)
        => await db.InventoryTransactions
            .Include(t => t.Variant)
            .ThenInclude(v => v!.Product)
            .Where(t => t.ProductVariantId == variantId)
            .OrderByDescending(t => t.CreatedAt)
            .Take(limit)
            .ToListAsync();

    public async Task<IEnumerable<InventoryTransaction>> GetByReferenceIdAsync(Guid referenceId)
        => await db.InventoryTransactions
            .Include(t => t.Variant)
            .ThenInclude(v => v!.Product)
            .Where(t => t.ReferenceId == referenceId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

    public async Task<IEnumerable<InventoryTransaction>> GetByProductIdAsync(Guid productId)
        => await db.InventoryTransactions
            .Include(t => t.Variant)
            .ThenInclude(v => v!.Product)
            .Where(t => t.Variant!.ProductId == productId)
            .OrderByDescending(t => t.CreatedAt)
            .Take(200)
            .ToListAsync();

    public async Task<IEnumerable<InventoryTransaction>> GetBySellerIdAsync(Guid sellerId)
        => await db.InventoryTransactions
            .Include(t => t.Variant)
            .ThenInclude(v => v!.Product)
            .Where(t => t.Variant!.Product!.SellerId == sellerId)
            .OrderByDescending(t => t.CreatedAt)
            .Take(500)
            .ToListAsync();

    public async Task<IEnumerable<InventoryTransaction>> GetPurchasesBySellerAsync(Guid sellerId, DateTime since)
        => await db.InventoryTransactions
            .Where(t =>
                t.ChangeType == PrakashMart.Domain.Enums.InventoryChangeType.Purchase &&
                t.CreatedAt >= since &&
                t.Variant!.Product!.SellerId == sellerId)
            .ToListAsync();

    public async Task<IEnumerable<InventoryTransaction>> GetPurchasesAllAsync(DateTime since)
        => await db.InventoryTransactions
            .Where(t =>
                t.ChangeType == PrakashMart.Domain.Enums.InventoryChangeType.Purchase &&
                t.CreatedAt >= since)
            .ToListAsync();
}
