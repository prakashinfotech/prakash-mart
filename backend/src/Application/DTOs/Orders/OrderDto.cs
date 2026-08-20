namespace PrakashMart.Application.DTOs.Orders;

public record OrderDto(
    Guid Id,
    string Status,
    string ShippingAddress,
    string City,
    string State,
    string PostalCode,
    string PaymentMethod,
    decimal TotalAmount,
    IEnumerable<OrderItemDto> Items,
    DateTime CreatedAt,
    string? CouponCode = null,
    decimal DiscountAmount = 0,
    decimal WalletAmountUsed = 0,
    string? RazorpayPaymentId = null);
