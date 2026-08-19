using PrakashMart.Application.Services;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Enums;
using PrakashMart.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace Application.Tests.Forecast;

public class InventoryForecastServiceTests
{
    private readonly Mock<IInventoryTransactionRepository> _txRepo = new();
    private readonly Mock<IProductVariantRepository> _variantRepo = new();
    private readonly InventoryForecastService _sut;

    private static readonly Guid SellerId = Guid.NewGuid();
    private static readonly Guid ProductId = Guid.NewGuid();

    public InventoryForecastServiceTests()
    {
        _sut = new InventoryForecastService(_txRepo.Object, _variantRepo.Object);
    }

    private static ProductVariant MakeVariant(int stock = 10, int reserved = 0)
        => ProductVariant.Create(ProductId, "{\"Size\":\"M\"}", stock, null);

    private static InventoryTransaction MakePurchase(Guid variantId, int qty, int daysAgo = 1)
    {
        var tx = InventoryTransaction.Create(variantId, InventoryChangeType.Purchase,
            10, 10 - qty, $"Sold {qty}");
        return tx;
    }

    [Fact]
    public async Task GetSellerForecast_ReturnsHealthyStatus_WhenSalesVelocityIsLow()
    {
        var variant = MakeVariant(stock: 100);
        _variantRepo.Setup(r => r.GetActiveBySellerIdAsync(SellerId)).ReturnsAsync([variant]);
        // 2 units sold over 30 days = 0.07/day → 100 / 0.07 ≈ 1428 days → Healthy
        _txRepo.Setup(r => r.GetPurchasesBySellerAsync(SellerId, It.IsAny<DateTime>()))
            .ReturnsAsync([MakePurchase(variant.Id, 2)]);

        var result = await _sut.GetSellerForecastAsync(SellerId);

        result.HealthyCount.Should().Be(1);
        result.Items.First().Status.Should().Be("Healthy");
    }

    [Fact]
    public async Task GetSellerForecast_ReturnsCriticalStatus_WhenDaysRemainingBelow7()
    {
        var variant = MakeVariant(stock: 5);
        _variantRepo.Setup(r => r.GetActiveBySellerIdAsync(SellerId)).ReturnsAsync([variant]);
        // 30 units in 7 days = 4.3/day → 5 / 4.3 ≈ 1.2 days → Critical
        _txRepo.Setup(r => r.GetPurchasesBySellerAsync(SellerId, It.IsAny<DateTime>()))
            .ReturnsAsync([MakePurchase(variant.Id, 30, daysAgo: 1)]);

        var result = await _sut.GetSellerForecastAsync(SellerId);

        result.CriticalCount.Should().Be(1);
        result.Items.First().Status.Should().Be("Critical");
    }

    [Fact]
    public async Task GetSellerForecast_ReturnsOutOfStock_WhenAvailableStockIsZero()
    {
        var variant = MakeVariant(stock: 0);
        _variantRepo.Setup(r => r.GetActiveBySellerIdAsync(SellerId)).ReturnsAsync([variant]);
        _txRepo.Setup(r => r.GetPurchasesBySellerAsync(SellerId, It.IsAny<DateTime>()))
            .ReturnsAsync([]);

        var result = await _sut.GetSellerForecastAsync(SellerId);

        result.OutOfStockCount.Should().Be(1);
        result.Items.First().DaysRemaining.Should().Be(0);
    }

    [Fact]
    public async Task GetSellerForecast_ReturnsNoSales_WhenNoPurchasesInWindow()
    {
        var variant = MakeVariant(stock: 20);
        _variantRepo.Setup(r => r.GetActiveBySellerIdAsync(SellerId)).ReturnsAsync([variant]);
        _txRepo.Setup(r => r.GetPurchasesBySellerAsync(SellerId, It.IsAny<DateTime>()))
            .ReturnsAsync([]);

        var result = await _sut.GetSellerForecastAsync(SellerId);

        result.NoSalesCount.Should().Be(1);
        result.Items.First().DaysRemaining.Should().Be(-1);
    }

    [Fact]
    public async Task GetSellerForecast_SortsCriticalBeforeHealthy()
    {
        var critical = MakeVariant(stock: 3);
        var healthy = MakeVariant(stock: 200);
        _variantRepo.Setup(r => r.GetActiveBySellerIdAsync(SellerId)).ReturnsAsync([healthy, critical]);
        _txRepo.Setup(r => r.GetPurchasesBySellerAsync(SellerId, It.IsAny<DateTime>()))
            .ReturnsAsync([
                MakePurchase(critical.Id, 20, daysAgo: 1),
                MakePurchase(healthy.Id, 1, daysAgo: 10),
            ]);

        var result = await _sut.GetSellerForecastAsync(SellerId);

        result.Items.First().VariantId.Should().Be(critical.Id);
    }
}
