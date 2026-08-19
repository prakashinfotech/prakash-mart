using PrakashMart.Domain.Entities;

namespace PrakashMart.Domain.Interfaces;

public interface IProductVariantRepository
{
    Task<IEnumerable<ProductVariant>> GetByProductIdAsync(Guid productId);
    Task<ProductVariant?> GetByIdAsync(Guid id);
    Task<ProductVariant?> GetBySkuAsync(string sku);
    Task AddAsync(ProductVariant variant);
    void Update(ProductVariant variant);
    void Delete(ProductVariant variant);

    // Issues a single atomic UPDATE … WHERE Stock - ReservedQuantity >= qty.
    // Returns true if the row was updated (stock available), false if not (insufficient stock).
    Task<bool> AtomicDeductStockAsync(Guid variantId, int quantity);

    // Restores stock after order cancellation or reservation release.
    Task RestoreStockAsync(Guid variantId, int quantity);

    // Forecast: all active variants for a seller (includes Product nav)
    Task<IEnumerable<ProductVariant>> GetActiveBySellerIdAsync(Guid sellerId);
    // Forecast: all active variants platform-wide (admin), capped for performance
    Task<IEnumerable<ProductVariant>> GetAllActiveAsync(int limit = 500);

    // Deducts stock AND releases the reservation in one SQL statement.
    // Used when the user pre-reserved this stock: checks Stock >= qty (not AvailableStock).
    Task<bool> AtomicDeductWithReservationAsync(Guid variantId, int quantity);

    // Atomically increments ReservedQuantity WHERE AvailableStock >= qty.
    // Returns true if the reservation succeeded.
    Task<bool> AtomicReserveAsync(Guid variantId, int quantity);

    // Decrements ReservedQuantity (clamped to 0) when a reservation is released.
    Task AtomicReleaseReservationAsync(Guid variantId, int quantity);
}
