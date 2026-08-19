namespace PrakashMart.Application.DTOs.Seller;

public record SellerOrderDto(
    Guid OrderId,
    string Status,
    DateTime OrderDate,
    string CustomerName,
    IEnumerable<SellerOrderItemDto> Items,
    decimal SellerRevenue);

public record SellerOrderItemDto(
    Guid ProductId,
    string ProductName,
    string? VariantLabel,
    decimal UnitPrice,
    int Quantity,
    decimal Subtotal);
