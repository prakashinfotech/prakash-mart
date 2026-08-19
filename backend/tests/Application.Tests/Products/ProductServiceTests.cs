using PrakashMart.Application.Common.Exceptions;
using PrakashMart.Application.DTOs.Products;
using PrakashMart.Application.Interfaces;
using PrakashMart.Application.Services;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace Application.Tests.Products;

public class ProductServiceTests
{
    private readonly Mock<IProductRepository> _productRepo = new();
    private readonly Mock<ICategoryRepository> _categoryRepo = new();
    private readonly Mock<IBrandRepository> _brandRepo = new();
    private readonly Mock<IUserRepository> _userRepo = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly ProductService _sut;

    private static readonly Guid CategoryId = Guid.NewGuid();
    private static readonly Guid BrandId = Guid.NewGuid();
    private static readonly Guid SellerId = Guid.NewGuid();

    public ProductServiceTests()
    {
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _sut = new ProductService(_productRepo.Object, _categoryRepo.Object, _brandRepo.Object, _userRepo.Object, _uow.Object);
    }

    // ── GetById ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetById_ThrowsNotFoundException_WhenProductNotFound()
    {
        _productRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Product?)null);

        var act = () => _sut.GetByIdAsync(Guid.NewGuid());

        await act.Should().ThrowAsync<NotFoundException>().WithMessage("*Product not found*");
    }

    [Fact]
    public async Task GetById_ThrowsNotFoundException_WhenSellerIsInactive()
    {
        // Simulate what the repo does when seller is inactive: returns null
        // (ProductRepository.GetByIdAsync filters out inactive-seller products)
        _productRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Product?)null);

        var act = () => _sut.GetByIdAsync(Guid.NewGuid());

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task GetById_ReturnsProduct_WhenSellerIsActive()
    {
        var product = Product.Create("Laptop", "desc", 50000, 10, CategoryId, BrandId, "img.jpg", 5, SellerId);
        _productRepo.Setup(r => r.GetByIdAsync(product.Id)).ReturnsAsync(product);

        var result = await _sut.GetByIdAsync(product.Id);

        result.Id.Should().Be(product.Id);
        result.Name.Should().Be("Laptop");
    }

    // ── GetFiltered ───────────────────────────────────────────────────────────

    [Fact]
    public async Task GetFiltered_ReturnsEmptyList_WhenAllMatchingSellerIsInactive()
    {
        // Repo returns empty because it filters p.Seller.IsActive internally
        _productRepo.Setup(r => r.GetFilteredAsync(
            It.IsAny<string?>(), It.IsAny<Guid?>(), It.IsAny<decimal?>(),
            It.IsAny<decimal?>(), It.IsAny<int?>(), It.IsAny<string?>(), It.IsAny<string?>()))
            .ReturnsAsync([]);

        var result = await _sut.GetFilteredAsync(new ProductFilterDto(null, null, null, null, null));

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetFiltered_ReturnsOnlyActiveSellerProducts()
    {
        var activeProduct = Product.Create("Phone", "desc", 20000, 5, CategoryId, BrandId, "img.jpg", 10, SellerId);
        // Repo returns only the active-seller product (inactive-seller product already excluded by repo)
        _productRepo.Setup(r => r.GetFilteredAsync(
            It.IsAny<string?>(), It.IsAny<Guid?>(), It.IsAny<decimal?>(),
            It.IsAny<decimal?>(), It.IsAny<int?>(), It.IsAny<string?>(), It.IsAny<string?>()))
            .ReturnsAsync([activeProduct]);

        var result = await _sut.GetFilteredAsync(new ProductFilterDto(null, null, null, null, null));

        result.Should().HaveCount(1);
        result.First().Name.Should().Be("Phone");
    }

    // ── GetSuggestions ────────────────────────────────────────────────────────

    [Fact]
    public async Task GetSuggestions_ReturnsEmpty_WhenQueryIsTooShort()
    {
        var result = await _sut.GetSuggestionsAsync("a");

        result.Should().BeEmpty();
        _productRepo.Verify(r => r.GetSuggestionsAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task GetSuggestions_ReturnsSuggestions_WhenQueryIsValid()
    {
        _productRepo.Setup(r => r.GetSuggestionsAsync("sam", 8))
            .ReturnsAsync([("Samsung Galaxy", "product"), ("Samsung", "brand")]);

        var result = await _sut.GetSuggestionsAsync("sam");

        result.Should().HaveCount(2);
        result.First().Term.Should().Be("Samsung Galaxy");
    }
}
