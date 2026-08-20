namespace PrakashMart.Application.DTOs.Orders;

public record OrderItemDto(
    Guid ProductId,
    string ProductName,
    decimal UnitPrice,
    int Quantity,
    decimal Subtotal,
    string? VariantLabel = null);
