using PrakashMart.Application.Common.Exceptions;
using PrakashMart.Application.Interfaces;
using PrakashMart.Application.Services;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace Application.Tests.Coupons;

public class CouponServiceTests
{
    private readonly Mock<ICouponRepository> _couponRepo = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly CouponService _sut;

    public CouponServiceTests()
    {
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _sut = new CouponService(_couponRepo.Object, _uow.Object);
    }

    [Fact]
    public async Task Validate_ThrowsAppException_WhenCodeNotFound()
    {
        _couponRepo.Setup(r => r.GetByCodeAsync("INVALID")).ReturnsAsync((Coupon?)null);

        var act = () => _sut.ValidateAsync("INVALID", 1000);

        await act.Should().ThrowAsync<AppException>().WithMessage("*Invalid coupon*");
    }

    [Fact]
    public async Task Validate_ThrowsAppException_WhenCouponIsExpired()
    {
        var expired = Coupon.Create("OLD10", 10, 100, DateTime.UtcNow.AddDays(-1));
        _couponRepo.Setup(r => r.GetByCodeAsync("OLD10")).ReturnsAsync(expired);

        var act = () => _sut.ValidateAsync("OLD10", 1000);

        await act.Should().ThrowAsync<AppException>().WithMessage("*expired*");
    }

    [Fact]
    public async Task Validate_ReturnsCorrectDiscount_WhenCouponIsValid()
    {
        var coupon = Coupon.Create("SAVE20", 20, 100, DateTime.UtcNow.AddDays(30));
        _couponRepo.Setup(r => r.GetByCodeAsync("SAVE20")).ReturnsAsync(coupon);

        var result = await _sut.ValidateAsync("SAVE20", 1000);

        result.DiscountAmount.Should().Be(200);
        result.FinalAmount.Should().Be(800);
        result.Code.Should().Be("SAVE20");
    }

    [Fact]
    public async Task Validate_IsCaseInsensitive()
    {
        var coupon = Coupon.Create("WELCOME10", 10, 100, DateTime.UtcNow.AddDays(30));
        _couponRepo.Setup(r => r.GetByCodeAsync("WELCOME10")).ReturnsAsync(coupon);

        var result = await _sut.ValidateAsync("welcome10", 500);

        result.DiscountAmount.Should().Be(50);
        result.FinalAmount.Should().Be(450);
    }

    [Fact]
    public async Task Validate_ThrowsAppException_WhenUsageLimitReached()
    {
        var coupon = Coupon.Create("USED", 10, 1, DateTime.UtcNow.AddDays(30));
        coupon.Redeem(); // MaxUses = 1, UsedCount now = 1 → IsValid() = false
        _couponRepo.Setup(r => r.GetByCodeAsync("USED")).ReturnsAsync(coupon);

        var act = () => _sut.ValidateAsync("USED", 500);

        await act.Should().ThrowAsync<AppException>().WithMessage("*expired or reached*");
    }
}
