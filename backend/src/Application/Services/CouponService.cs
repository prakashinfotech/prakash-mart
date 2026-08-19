using PrakashMart.Application.Common.Exceptions;
using PrakashMart.Application.DTOs.Coupons;
using PrakashMart.Application.Interfaces;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;

namespace PrakashMart.Application.Services;

public class CouponService(ICouponRepository couponRepository, IUnitOfWork unitOfWork) : ICouponService
{
    public async Task<IEnumerable<CouponDto>> GetAllAsync()
    {
        var coupons = await couponRepository.GetAllAsync();
        return coupons.Select(Map);
    }

    public async Task<CouponDto> CreateAsync(CreateCouponDto dto)
    {
        var code = dto.Code.ToUpperInvariant();
        if (await couponRepository.GetByCodeAsync(code) is not null)
            throw new AppException($"Coupon code '{code}' already exists.");

        var coupon = Coupon.Create(code, dto.DiscountPercent, dto.MaxUses, dto.ExpiresAt);
        await couponRepository.AddAsync(coupon);
        await unitOfWork.SaveChangesAsync();
        return Map(coupon);
    }

    public async Task<CouponValidateDto> ValidateAsync(string code, decimal cartTotal)
    {
        var coupon = await couponRepository.GetByCodeAsync(code.ToUpperInvariant())
            ?? throw new AppException("Invalid coupon code.");

        if (!coupon.IsValid())
            throw new AppException("This coupon has expired or reached its usage limit.");

        var discountAmount = Math.Round(cartTotal * coupon.DiscountPercent / 100, 2);
        var finalAmount = cartTotal - discountAmount;
        return new CouponValidateDto(coupon.Code, coupon.DiscountPercent, discountAmount, finalAmount);
    }

    public async Task DeleteAsync(Guid id)
    {
        var coupon = await couponRepository.GetByIdAsync(id)
            ?? throw new NotFoundException("Coupon not found.");
        couponRepository.Delete(coupon);
        await unitOfWork.SaveChangesAsync();
    }

    private static CouponDto Map(Coupon c) =>
        new(c.Id, c.Code, c.DiscountPercent, c.MaxUses, c.UsedCount, c.ExpiresAt, c.IsActive);
}
