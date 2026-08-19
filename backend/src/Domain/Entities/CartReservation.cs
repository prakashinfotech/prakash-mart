namespace PrakashMart.Domain.Entities;

public class CartReservation : BaseEntity
{
    public Guid UserId { get; private set; }
    public Guid ProductVariantId { get; private set; }
    public int Quantity { get; private set; }
    public DateTime ExpiresAt { get; private set; }
    public bool IsReleased { get; private set; }
    public DateTime? ReleasedAt { get; private set; }

    public ProductVariant? Variant { get; private set; }

    private CartReservation() { }

    public static CartReservation Create(Guid userId, Guid variantId, int quantity, DateTime expiresAt)
        => new() { UserId = userId, ProductVariantId = variantId, Quantity = quantity, ExpiresAt = expiresAt };

    public void Release()
    {
        IsReleased = true;
        ReleasedAt = DateTime.UtcNow;
        SetUpdated();
    }
}
