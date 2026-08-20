using PrakashMart.Application.Common.Exceptions;
using PrakashMart.Application.DTOs.Reviews;
using PrakashMart.Application.Interfaces;
using PrakashMart.Application.Services;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace Application.Tests.Reviews;

public class ReviewServiceTests
{
    private readonly Mock<IReviewRepository> _reviewRepo = new();
    private readonly Mock<IProductRepository> _productRepo = new();
    private readonly Mock<IOrderRepository> _orderRepo = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly ReviewService _sut;

    private static readonly Guid CategoryId = Guid.NewGuid();
    private static readonly Guid BrandId = Guid.NewGuid();
    private static readonly Guid SellerId = Guid.NewGuid();

    public ReviewServiceTests()
    {
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _sut = new ReviewService(_reviewRepo.Object, _productRepo.Object, _orderRepo.Object, _uow.Object);
    }

    // ── CanReviewAsync ────────────────────────────────────────────────────────

    [Fact]
    public async Task CanReview_ReturnsFalse_WhenUserHasNotPurchasedProduct()
    {
        var userId = Guid.NewGuid();
        var productId = Guid.NewGuid();

        _orderRepo.Setup(r => r.HasUserPurchasedProductAsync(userId, productId)).ReturnsAsync(false);

        var result = await _sut.CanReviewAsync(userId, productId);

        result.CanReview.Should().BeFalse();
        result.Reason.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task CanReview_ReturnsFalse_WhenUserAlreadyReviewed()
    {
        var userId = Guid.NewGuid();
        var productId = Guid.NewGuid();

        _orderRepo.Setup(r => r.HasUserPurchasedProductAsync(userId, productId)).ReturnsAsync(true);
        _reviewRepo.Setup(r => r.HasUserReviewedAsync(productId, userId)).ReturnsAsync(true);

        var result = await _sut.CanReviewAsync(userId, productId);

        result.CanReview.Should().BeFalse();
        result.Reason.Should().Contain("already reviewed");
    }

    [Fact]
    public async Task CanReview_ReturnsTrue_WhenPurchasedAndNotYetReviewed()
    {
        var userId = Guid.NewGuid();
        var productId = Guid.NewGuid();

        _orderRepo.Setup(r => r.HasUserPurchasedProductAsync(userId, productId)).ReturnsAsync(true);
        _reviewRepo.Setup(r => r.HasUserReviewedAsync(productId, userId)).ReturnsAsync(false);

        var result = await _sut.CanReviewAsync(userId, productId);

        result.CanReview.Should().BeTrue();
    }

    // ── CreateAsync (purchase gate) ───────────────────────────────────────────

    [Fact]
    public async Task Create_ThrowsForbiddenException_WhenUserHasNotPurchasedProduct()
    {
        var userId = Guid.NewGuid();
        var product = Product.Create("Phone", "desc", 1000, null, CategoryId, BrandId, "img.jpg", 5, SellerId);

        _productRepo.Setup(r => r.GetByIdAsync(product.Id)).ReturnsAsync(product);
        _orderRepo.Setup(r => r.HasUserPurchasedProductAsync(userId, product.Id)).ReturnsAsync(false);

        var act = () => _sut.CreateAsync(userId, new CreateReviewDto(product.Id, 5, "Great!"));

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Create_ThrowsAppException_WhenUserAlreadyReviewed()
    {
        var userId = Guid.NewGuid();
        var product = Product.Create("Phone", "desc", 1000, null, CategoryId, BrandId, "img.jpg", 5, SellerId);

        _productRepo.Setup(r => r.GetByIdAsync(product.Id)).ReturnsAsync(product);
        _orderRepo.Setup(r => r.HasUserPurchasedProductAsync(userId, product.Id)).ReturnsAsync(true);
        _reviewRepo.Setup(r => r.HasUserReviewedAsync(product.Id, userId)).ReturnsAsync(true);
        _reviewRepo.Setup(r => r.GetByProductIdAsync(product.Id)).ReturnsAsync([]);

        var act = () => _sut.CreateAsync(userId, new CreateReviewDto(product.Id, 5, "Great!"));

        await act.Should().ThrowAsync<AppException>().WithMessage("*already reviewed*");
    }
}
