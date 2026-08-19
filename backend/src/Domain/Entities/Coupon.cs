namespace PrakashMart.Domain.Entities;

public class Coupon : BaseEntity
{
    public string Code { get; private set; } = string.Empty;
    public decimal DiscountPercent { get; private set; }
    public int MaxUses { get; private set; }
    public int UsedCount { get; private set; }
    public DateTime ExpiresAt { get; private set; }
    public bool IsActive { get; private set; } = true;

    private Coupon() { }

    public static Coupon Create(string code, decimal discountPercent, int maxUses, DateTime expiresAt)
        => new() { Code = code.ToUpperInvariant(), DiscountPercent = discountPercent, MaxUses = maxUses, ExpiresAt = expiresAt };

    public bool IsValid() => IsActive && UsedCount < MaxUses && ExpiresAt >= DateTime.UtcNow;

    public void Redeem() { UsedCount++; SetUpdated(); }
    public void Deactivate() { IsActive = false; SetUpdated(); }
}
