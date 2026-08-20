using PrakashMart.Domain.Entities;

namespace PrakashMart.Domain.Interfaces;

public interface IInventoryTransactionRepository
{
    Task AddAsync(InventoryTransaction transaction);
    Task<IEnumerable<InventoryTransaction>> GetByVariantIdAsync(Guid variantId, int limit = 50);
    Task<IEnumerable<InventoryTransaction>> GetByReferenceIdAsync(Guid referenceId);
    Task<IEnumerable<InventoryTransaction>> GetByProductIdAsync(Guid productId);
    Task<IEnumerable<InventoryTransaction>> GetBySellerIdAsync(Guid sellerId);

    // Forecast: purchase transactions since a given date for velocity calculations
    Task<IEnumerable<InventoryTransaction>> GetPurchasesBySellerAsync(Guid sellerId, DateTime since);
    Task<IEnumerable<InventoryTransaction>> GetPurchasesAllAsync(DateTime since);
}
