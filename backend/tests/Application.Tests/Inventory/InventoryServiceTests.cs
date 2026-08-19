using PrakashMart.Application.Common.Exceptions;
using PrakashMart.Application.Services;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Enums;
using PrakashMart.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace Application.Tests.Inventory;

public class InventoryServiceTests
{
    private readonly Mock<IInventoryTransactionRepository> _txRepo = new();
    private readonly Mock<IProductVariantRepository> _variantRepo = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly InventoryService _sut;

    private static readonly Guid CategoryId = Guid.NewGuid();
    private static readonly Guid BrandId = Guid.NewGuid();
    private static readonly Guid SellerId = Guid.NewGuid();

    public InventoryServiceTests()
    {
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _txRepo.Setup(r => r.AddAsync(It.IsAny<InventoryTransaction>())).Returns(Task.CompletedTask);
        _sut = new InventoryService(_txRepo.Object, _variantRepo.Object, _uow.Object);
    }

    [Fact]
    public async Task RecordAsync_AddsTransactionWithCorrectFields()
    {
        var variantId = Guid.NewGuid();
        var orderId = Guid.NewGuid();

        await _sut.RecordAsync(variantId, InventoryChangeType.Purchase, 10, 8, "Sold 2 units", orderId, Guid.NewGuid());

        _txRepo.Verify(r => r.AddAsync(It.Is<InventoryTransaction>(t =>
            t.ProductVariantId == variantId &&
            t.ChangeType == InventoryChangeType.Purchase &&
            t.QuantityBefore == 10 &&
            t.QuantityAfter == 8 &&
            t.QuantityChanged == -2 &&
            t.ReferenceId == orderId)), Times.Once);
    }

    [Fact]
    public async Task AdminAdjustAsync_ThrowsAppException_WhenNewStockIsNegative()
    {
        var act = () => _sut.AdminAdjustAsync(Guid.NewGuid(), -1, "Bad input", Guid.NewGuid());

        await act.Should().ThrowAsync<AppException>().WithMessage("*negative*");
    }

    [Fact]
    public async Task AdminAdjustAsync_ThrowsNotFoundException_WhenVariantDoesNotExist()
    {
        _variantRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((ProductVariant?)null);

        var act = () => _sut.AdminAdjustAsync(Guid.NewGuid(), 50, "Restock", Guid.NewGuid());

        await act.Should().ThrowAsync<NotFoundException>().WithMessage("*Variant not found*");
    }

    [Fact]
    public async Task AdminAdjustAsync_UpdatesStockAndRecordsAdminAdjustmentAudit()
    {
        var adminId = Guid.NewGuid();
        var variant = ProductVariant.Create(Guid.NewGuid(), "{\"Size\":\"M\"}", 10, null);
        _variantRepo.Setup(r => r.GetByIdAsync(variant.Id)).ReturnsAsync(variant);
        _variantRepo.Setup(r => r.Update(It.IsAny<ProductVariant>()));

        await _sut.AdminAdjustAsync(variant.Id, 25, "Restock after audit", adminId);

        variant.Stock.Should().Be(25);
        _txRepo.Verify(r => r.AddAsync(It.Is<InventoryTransaction>(t =>
            t.ProductVariantId == variant.Id &&
            t.ChangeType == InventoryChangeType.AdminAdjustment &&
            t.QuantityBefore == 10 &&
            t.QuantityAfter == 25 &&
            t.CreatedBy == adminId)), Times.Once);
        _uow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetByVariantAsync_ReturnsMappedDtos()
    {
        var variantId = Guid.NewGuid();
        var tx = InventoryTransaction.Create(variantId, InventoryChangeType.SellerUpdate, 5, 15, "Seller restocked");
        _txRepo.Setup(r => r.GetByVariantIdAsync(variantId, 50)).ReturnsAsync([tx]);

        var result = (await _sut.GetByVariantAsync(variantId)).ToList();

        result.Should().HaveCount(1);
        result[0].ChangeType.Should().Be("SellerUpdate");
        result[0].QuantityChanged.Should().Be(10);
    }
}
