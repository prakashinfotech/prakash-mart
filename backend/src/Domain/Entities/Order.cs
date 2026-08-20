using PrakashMart.Domain.Enums;

namespace PrakashMart.Domain.Entities;

public class Order : BaseEntity
{
    public Guid UserId { get; private set; }
    public OrderStatus Status { get; private set; } = OrderStatus.Pending;
    public decimal TotalAmount { get; set; }
    public decimal WalletAmountUsed { get; set; }
    public string ShippingAddress { get; private set; } = string.Empty;
    public string PaymentMethod { get; private set; } = string.Empty;
    public string? CouponCode { get; set; }
    public decimal DiscountAmount { get; set; }
    public string? RazorpayOrderId { get; set; }
    public string? RazorpayPaymentId { get; set; }
    public ICollection<OrderItem> Items { get; private set; } = [];

    private Order() { }

    public static Order Create(Guid userId, string shippingAddress, string paymentMethod)
        => new() { UserId = userId, ShippingAddress = shippingAddress, PaymentMethod = paymentMethod };

    public void UpdateStatus(OrderStatus status) { Status = status; SetUpdated(); }
}

public class OrderItem : BaseEntity
{
    public Guid OrderId { get; private set; }
    public Guid ProductId { get; private set; }
    public Guid? VariantId { get; private set; }
    public string ProductName { get; private set; } = string.Empty;
    public string? VariantLabel { get; private set; }
    public decimal UnitPrice { get; private set; }
    public int Quantity { get; private set; }

    private OrderItem() { }

    public static OrderItem Create(Guid orderId, Guid productId, string productName, decimal unitPrice, int quantity, Guid? variantId = null, string? variantLabel = null)
        => new() { OrderId = orderId, ProductId = productId, ProductName = productName, UnitPrice = unitPrice, Quantity = quantity, VariantId = variantId, VariantLabel = variantLabel };
}
