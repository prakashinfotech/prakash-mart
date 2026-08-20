namespace PrakashMart.Application.DTOs.Cart;

public record CartItemDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string ProductImageUrl,
    decimal UnitPrice,
    int Quantity,
    decimal Subtotal,
    Guid? VariantId = null,
    string? VariantLabel = null);
