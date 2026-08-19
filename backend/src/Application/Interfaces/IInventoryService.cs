using PrakashMart.Application.DTOs.Inventory;
using PrakashMart.Domain.Enums;

namespace PrakashMart.Application.Interfaces;

public interface IInventoryService
{
    Task RecordAsync(Guid variantId, InventoryChangeType changeType, int quantityBefore, int quantityAfter, string reason, Guid? referenceId = null, Guid? createdBy = null);
    Task AdminAdjustAsync(Guid variantId, int newStock, string reason, Guid adminId);
    Task<IEnumerable<InventoryTransactionDto>> GetByVariantAsync(Guid variantId);
    Task<(Guid variantId, IEnumerable<InventoryTransactionDto> history)> GetBySkuAsync(string sku);
    Task<IEnumerable<InventoryTransactionDto>> GetByProductAsync(Guid productId);
    Task<IEnumerable<InventoryTransactionDto>> GetBySellerAsync(Guid sellerId);
}
