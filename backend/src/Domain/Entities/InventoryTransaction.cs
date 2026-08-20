using PrakashMart.Domain.Enums;

namespace PrakashMart.Domain.Entities;

public class InventoryTransaction : BaseEntity
{
    public Guid ProductVariantId { get; private set; }
    public InventoryChangeType ChangeType { get; private set; }
    public int QuantityBefore { get; private set; }
    public int QuantityAfter { get; private set; }
    public int QuantityChanged { get; private set; }
    public string Reason { get; private set; } = string.Empty;
    public Guid? ReferenceId { get; private set; }
    public Guid? CreatedBy { get; private set; }

    public ProductVariant? Variant { get; private set; }

    private InventoryTransaction() { }

    public static InventoryTransaction Create(
        Guid variantId,
        InventoryChangeType changeType,
        int quantityBefore,
        int quantityAfter,
        string reason,
        Guid? referenceId = null,
        Guid? createdBy = null)
    {
        return new InventoryTransaction
        {
            ProductVariantId = variantId,
            ChangeType = changeType,
            QuantityBefore = quantityBefore,
            QuantityAfter = quantityAfter,
            QuantityChanged = quantityAfter - quantityBefore,
            Reason = reason,
            ReferenceId = referenceId,
            CreatedBy = createdBy,
        };
    }
}
