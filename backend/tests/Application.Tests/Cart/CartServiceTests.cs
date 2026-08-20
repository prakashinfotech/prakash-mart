using PrakashMart.Application.Common.Exceptions;
using PrakashMart.Application.DTOs.Cart;
using PrakashMart.Application.Services;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;
using FluentAssertions;
using Moq;
using CartEntity = PrakashMart.Domain.Entities.Cart;

namespace Application.Tests.Cart;

public class CartServiceTests
{
    private readonly Mock<ICartRepository> _cartRepo = new();
    private readonly Mock<IProductRepository> _productRepo = new();
    private readonly Mock<IProductVariantRepository> _variantRepo = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly CartService _sut;

    private static readonly Guid CategoryId = Guid.NewGuid();
    private static readonly Guid BrandId = Guid.NewGuid();
    private static readonly Guid SellerId = Guid.NewGuid();

    public CartServiceTests()
    {
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _cartRepo.Setup(r => r.AddAsync(It.IsAny<CartEntity>())).Returns(Task.CompletedTask);
        _sut = new CartService(_cartRepo.Object, _productRepo.Object, _variantRepo.Object, _uow.Object);
    }

    [Fact]
    public async Task AddItem_ThrowsNotFoundException_WhenProductDoesNotExist()
    {
        _productRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Product?)null);
        _cartRepo.Setup(r => r.GetByUserIdWithItemsAsync(It.IsAny<Guid>())).ReturnsAsync((CartEntity?)null);

        var act = () => _sut.AddItemAsync(Guid.NewGuid(), new AddToCartDto(Guid.NewGuid(), 1));

        await act.Should().ThrowAsync<NotFoundException>().WithMessage("*Product not found*");
    }

    [Fact]
    public async Task AddItem_ThrowsAppException_WhenNoVariantIdProvided()
    {
        var product = Product.Create("Laptop", "desc", 50000, null, CategoryId, BrandId, "img.jpg", 0, SellerId);
        _productRepo.Setup(r => r.GetByIdAsync(product.Id)).ReturnsAsync(product);
        _cartRepo.Setup(r => r.GetByUserIdWithItemsAsync(It.IsAny<Guid>())).ReturnsAsync((CartEntity?)null);

        var act = () => _sut.AddItemAsync(Guid.NewGuid(), new AddToCartDto(product.Id, 1));

        await act.Should().ThrowAsync<AppException>().WithMessage("*select a variant*");
    }

    [Fact]
    public async Task AddItem_ThrowsAppException_WhenProductHasVariantsButNoVariantIdProvided()
    {
        var product = Product.Create("Shirt", "desc", 999, null, CategoryId, BrandId, "img.jpg", 0, SellerId);
        product.Variants.Add(ProductVariant.Create(product.Id, "{\"Size\":\"M\"}", 10, null));
        _productRepo.Setup(r => r.GetByIdAsync(product.Id)).ReturnsAsync(product);
        _cartRepo.Setup(r => r.GetByUserIdWithItemsAsync(It.IsAny<Guid>())).ReturnsAsync((CartEntity?)null);

        var act = () => _sut.AddItemAsync(Guid.NewGuid(), new AddToCartDto(product.Id, 1));

        await act.Should().ThrowAsync<AppException>().WithMessage("*select a variant*");
    }

    [Fact]
    public async Task AddItem_ThrowsNotFoundException_WhenVariantDoesNotExist()
    {
        var product = Product.Create("Shirt", "desc", 999, null, CategoryId, BrandId, "img.jpg", 10, SellerId);
        _productRepo.Setup(r => r.GetByIdAsync(product.Id)).ReturnsAsync(product);
        _variantRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((ProductVariant?)null);
        _cartRepo.Setup(r => r.GetByUserIdWithItemsAsync(It.IsAny<Guid>())).ReturnsAsync((CartEntity?)null);

        var act = () => _sut.AddItemAsync(Guid.NewGuid(), new AddToCartDto(product.Id, 1, Guid.NewGuid()));

        await act.Should().ThrowAsync<NotFoundException>().WithMessage("*Variant not found*");
    }

    [Fact]
    public async Task RemoveItem_ThrowsNotFoundException_WhenCartDoesNotExist()
    {
        _cartRepo.Setup(r => r.GetByUserIdWithItemsAsync(It.IsAny<Guid>())).ReturnsAsync((CartEntity?)null);

        var act = () => _sut.RemoveItemAsync(Guid.NewGuid(), Guid.NewGuid());

        await act.Should().ThrowAsync<NotFoundException>().WithMessage("*Cart not found*");
    }

    [Fact]
    public async Task RemoveItem_ThrowsNotFoundException_WhenCartItemDoesNotExist()
    {
        var userId = Guid.NewGuid();
        var cart = CartEntity.Create(userId);
        _cartRepo.Setup(r => r.GetByUserIdWithItemsAsync(userId)).ReturnsAsync(cart);

        var act = () => _sut.RemoveItemAsync(userId, Guid.NewGuid());

        await act.Should().ThrowAsync<NotFoundException>().WithMessage("*Cart item not found*");
    }
}
