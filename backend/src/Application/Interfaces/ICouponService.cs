using PrakashMart.Application.DTOs.Coupons;

namespace PrakashMart.Application.Interfaces;

public interface ICouponService
{
    Task<IEnumerable<CouponDto>> GetAllAsync();
    Task<CouponDto> CreateAsync(CreateCouponDto dto);
    Task<CouponValidateDto> ValidateAsync(string code, decimal cartTotal);
    Task DeleteAsync(Guid id);
}
