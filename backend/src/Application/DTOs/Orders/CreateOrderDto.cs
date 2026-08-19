namespace PrakashMart.Application.DTOs.Orders;

public record CreateOrderDto(
    string ShippingAddress,
    string City,
    string State,
    string PostalCode,
    string PaymentMethod,
    IEnumerable<CreateOrderItemDto> Items,
    string? CouponCode = null,
    decimal WalletAmount = 0,
    string? RazorpayOrderId = null,
    string? RazorpayPaymentId = null);

public record CreateOrderItemDto(Guid ProductId, int Quantity, Guid? VariantId = null);
