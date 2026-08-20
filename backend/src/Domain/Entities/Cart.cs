namespace PrakashMart.Domain.Entities;

public class Cart : BaseEntity
{
    public Guid UserId { get; private set; }
    public ICollection<CartItem> Items { get; private set; } = [];

    private Cart() { }

    public static Cart Create(Guid userId) => new() { UserId = userId };
}

public class CartItem : BaseEntity
{
    public Guid CartId { get; private set; }
    public Guid ProductId { get; private set; }
    public Guid? VariantId { get; private set; }
    public string? VariantLabel { get; private set; }
    public decimal UnitPrice { get; private set; }
    public int Quantity { get; private set; }
    public Product? Product { get; private set; }
    public ProductVariant? Variant { get; private set; }

    private CartItem() { }

    public static CartItem Create(Guid cartId, Guid productId, decimal unitPrice, int quantity, Guid? variantId = null, string? variantLabel = null)
        => new() { CartId = cartId, ProductId = productId, UnitPrice = unitPrice, Quantity = quantity, VariantId = variantId, VariantLabel = variantLabel };

    public void UpdateQuantity(int quantity) { Quantity = quantity; SetUpdated(); }
}
