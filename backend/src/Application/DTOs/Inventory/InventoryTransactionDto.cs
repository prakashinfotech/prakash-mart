namespace PrakashMart.Application.DTOs.Inventory;

public record InventoryTransactionDto(
    Guid Id,
    Guid ProductVariantId,
    string ProductName,
    string VariantLabel,
    string SKU,
    string ChangeType,
    int QuantityBefore,
    int QuantityAfter,
    int QuantityChanged,
    string Reason,
    Guid? ReferenceId,
    Guid? CreatedBy,
    DateTime CreatedAt
);

public record AdminAdjustDto(int NewStock, string Reason);
