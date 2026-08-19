namespace PrakashMart.Application.DTOs.Coupons;

public record CouponDto(Guid Id, string Code, decimal DiscountPercent, int MaxUses, int UsedCount, DateTime ExpiresAt, bool IsActive);
public record CreateCouponDto(string Code, decimal DiscountPercent, int MaxUses, DateTime ExpiresAt);
public record CouponValidateDto(string Code, decimal DiscountPercent, decimal DiscountAmount, decimal FinalAmount);
