using PrakashMart.Application.Common.Exceptions;
using PrakashMart.Application.DTOs.Inventory;
using PrakashMart.Application.Interfaces;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Enums;
using PrakashMart.Domain.Interfaces;

namespace PrakashMart.Application.Services;

public class InventoryService(
    IInventoryTransactionRepository txRepository,
    IProductVariantRepository variantRepository,
    IUnitOfWork unitOfWork) : IInventoryService
{
    public async Task RecordAsync(
        Guid variantId,
        InventoryChangeType changeType,
        int quantityBefore,
        int quantityAfter,
        string reason,
        Guid? referenceId = null,
        Guid? createdBy = null)
    {
        var tx = InventoryTransaction.Create(variantId, changeType, quantityBefore, quantityAfter, reason, referenceId, createdBy);
        await txRepository.AddAsync(tx);
    }

    public async Task AdminAdjustAsync(Guid variantId, int newStock, string reason, Guid adminId)
    {
        if (newStock < 0)
            throw new AppException("Stock cannot be negative.");

        var variant = await variantRepository.GetByIdAsync(variantId)
            ?? throw new NotFoundException("Variant not found.");

        var before = variant.Stock;
        variant.SetStock(newStock);
        variantRepository.Update(variant);

        var tx = InventoryTransaction.Create(
            variantId, InventoryChangeType.AdminAdjustment,
            before, newStock,
            string.IsNullOrWhiteSpace(reason) ? "Admin stock adjustment" : reason,
            referenceId: null, createdBy: adminId);

        await txRepository.AddAsync(tx);
        await unitOfWork.SaveChangesAsync();
    }

    public async Task<IEnumerable<InventoryTransactionDto>> GetByVariantAsync(Guid variantId)
        => (await txRepository.GetByVariantIdAsync(variantId)).Select(Map);

    public async Task<(Guid variantId, IEnumerable<InventoryTransactionDto> history)> GetBySkuAsync(string sku)
    {
        var variant = await variantRepository.GetBySkuAsync(sku)
            ?? throw new NotFoundException($"No variant found with SKU \"{sku.ToUpperInvariant()}\".");
        var history = (await txRepository.GetByVariantIdAsync(variant.Id)).Select(Map);
        return (variant.Id, history);
    }

    public async Task<IEnumerable<InventoryTransactionDto>> GetByProductAsync(Guid productId)
        => (await txRepository.GetByProductIdAsync(productId)).Select(Map);

    public async Task<IEnumerable<InventoryTransactionDto>> GetBySellerAsync(Guid sellerId)
        => (await txRepository.GetBySellerIdAsync(sellerId)).Select(Map);

    private static InventoryTransactionDto Map(InventoryTransaction t) =>
        new(t.Id, t.ProductVariantId,
            t.Variant?.Product?.Name ?? string.Empty,
            t.Variant?.Label ?? string.Empty,
            t.Variant?.SKU ?? string.Empty,
            t.ChangeType.ToString(), t.QuantityBefore, t.QuantityAfter,
            t.QuantityChanged, t.Reason, t.ReferenceId, t.CreatedBy, t.CreatedAt);
}
