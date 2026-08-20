using PrakashMart.Application.Common.Exceptions;
using PrakashMart.Application.DTOs.Orders;
using PrakashMart.Application.DTOs.Reservations;
using PrakashMart.Application.Interfaces;
using PrakashMart.Application.Services;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace Application.Tests.Orders;

public class OrderServiceTests
{
    private readonly Mock<IOrderRepository> _orderRepo = new();
    private readonly Mock<IProductRepository> _productRepo = new();
    private readonly Mock<IProductVariantRepository> _variantRepo = new();
    private readonly Mock<ICouponRepository> _couponRepo = new();
    private readonly Mock<IUserRepository> _userRepo = new();
    private readonly Mock<IWalletRepository> _walletRepo = new();
    private readonly Mock<IEmailService> _email = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly Mock<ITransaction> _tx = new();
    private readonly Mock<IInventoryService> _inventory = new();
    private readonly Mock<ICartReservationService> _cartReservation = new();
    private readonly Mock<IPushNotificationService> _push = new();
    private readonly OrderService _sut;

    private static readonly Guid CategoryId = Guid.NewGuid();
    private static readonly Guid BrandId = Guid.NewGuid();
    private static readonly Guid SellerId = Guid.NewGuid();

    public OrderServiceTests()
    {
        _tx.Setup(t => t.CommitAsync()).Returns(Task.CompletedTask);
        _tx.Setup(t => t.RollbackAsync()).Returns(Task.CompletedTask);
        _tx.Setup(t => t.DisposeAsync()).Returns(ValueTask.CompletedTask);
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _uow.Setup(u => u.BeginTransactionAsync()).ReturnsAsync(_tx.Object);
        _orderRepo.Setup(r => r.AddAsync(It.IsAny<Order>())).Returns(Task.CompletedTask);
        _walletRepo.Setup(r => r.GetByUserIdAsync(It.IsAny<Guid>())).ReturnsAsync((Wallet?)null);
        _variantRepo.Setup(r => r.AtomicDeductStockAsync(It.IsAny<Guid>(), It.IsAny<int>())).ReturnsAsync(true);
        _variantRepo.Setup(r => r.AtomicDeductWithReservationAsync(It.IsAny<Guid>(), It.IsAny<int>())).ReturnsAsync(true);
        _variantRepo.Setup(r => r.RestoreStockAsync(It.IsAny<Guid>(), It.IsAny<int>())).Returns(Task.CompletedTask);
        _inventory.Setup(s => s.RecordAsync(It.IsAny<Guid>(), It.IsAny<PrakashMart.Domain.Enums.InventoryChangeType>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>(), It.IsAny<Guid?>(), It.IsAny<Guid?>())).Returns(Task.CompletedTask);
        _cartReservation.Setup(s => s.ReleaseAsync(It.IsAny<Guid>())).Returns(Task.CompletedTask);
        _cartReservation.Setup(s => s.GetStatusAsync(It.IsAny<Guid>()))
            .ReturnsAsync(new CartReservationStatusDto(false, null, 0, []));
        _push.Setup(s => s.SendToUserAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);
        _sut = new OrderService(_orderRepo.Object, _productRepo.Object, _variantRepo.Object, _couponRepo.Object, _userRepo.Object, _walletRepo.Object, _email.Object, _uow.Object, _inventory.Object, _cartReservation.Object, _push.Object);
    }

    private static CreateOrderDto BuildOrderDto(IEnumerable<CreateOrderItemDto> items, string? coupon = null)
        => new("123 Main St", "Mumbai", "MH", "400001", "UPI", items, coupon);

    [Fact]
    public async Task Create_ThrowsAppException_WhenNoItemsProvided()
    {
        var act = () => _sut.CreateAsync(Guid.NewGuid(), BuildOrderDto([]));

        await act.Should().ThrowAsync<AppException>().WithMessage("*at least one item*");
    }

    [Fact]
    public async Task Create_ThrowsNotFoundException_WhenProductDoesNotExist()
    {
        _productRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Product?)null);

        var act = () => _sut.CreateAsync(Guid.NewGuid(),
            BuildOrderDto([new CreateOrderItemDto(Guid.NewGuid(), 1)]));

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Create_ThrowsAppException_WhenProductStockIsInsufficient()
    {
        var product = Product.Create("Phone", "desc", 20000, null, CategoryId, BrandId, "img.jpg", 1, SellerId);
        _productRepo.Setup(r => r.GetByIdAsync(product.Id)).ReturnsAsync(product);
        _productRepo.Setup(r => r.Update(It.IsAny<Product>()));

        var act = () => _sut.CreateAsync(Guid.NewGuid(),
            BuildOrderDto([new CreateOrderItemDto(product.Id, 5)])); // 5 requested, 1 in stock

        await act.Should().ThrowAsync<AppException>().WithMessage("*Insufficient stock*");
    }

    [Fact]
    public async Task Create_AppliesCouponDiscount_WhenValidCouponProvided()
    {
        var product = Product.Create("Headphones", "desc", 2000, null, CategoryId, BrandId, "img.jpg", 10, SellerId);
        var coupon = Coupon.Create("SAVE10", 10, 100, DateTime.UtcNow.AddDays(30));

        _productRepo.Setup(r => r.GetByIdAsync(product.Id)).ReturnsAsync(product);
        _productRepo.Setup(r => r.Update(It.IsAny<Product>()));
        _couponRepo.Setup(r => r.GetByCodeAsync("SAVE10")).ReturnsAsync(coupon);
        _couponRepo.Setup(r => r.Update(It.IsAny<Coupon>()));

        var result = await _sut.CreateAsync(Guid.NewGuid(),
            BuildOrderDto([new CreateOrderItemDto(product.Id, 1)], "SAVE10"));

        result.DiscountAmount.Should().Be(200); // 10% of 2000
        result.TotalAmount.Should().Be(1800);
        result.CouponCode.Should().Be("SAVE10");
    }

    [Fact]
    public async Task GetById_ThrowsForbiddenException_WhenUserDoesNotOwnOrder()
    {
        var ownerId = Guid.NewGuid();
        var requesterId = Guid.NewGuid();
        var order = Order.Create(ownerId, "123 Main St", "UPI");
        _orderRepo.Setup(r => r.GetByIdWithItemsAsync(order.Id)).ReturnsAsync(order);

        var act = () => _sut.GetByIdAsync(order.Id, requesterId);

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task GetById_ThrowsNotFoundException_WhenOrderDoesNotExist()
    {
        _orderRepo.Setup(r => r.GetByIdWithItemsAsync(It.IsAny<Guid>())).ReturnsAsync((Order?)null);

        var act = () => _sut.GetByIdAsync(Guid.NewGuid(), Guid.NewGuid());

        await act.Should().ThrowAsync<NotFoundException>().WithMessage("*Order not found*");
    }

    // ── CancelOrderAsync — COD refund fix ─────────────────────────────────────

    [Fact]
    public async Task CancelOrder_DoesNotCreditWallet_WhenCodOrderWithNoWalletUsed()
    {
        var userId = Guid.NewGuid();
        var order = Order.Create(userId, "123 Street", "COD");
        order.TotalAmount = 500;
        // WalletAmountUsed defaults to 0

        _orderRepo.Setup(r => r.GetByIdWithItemsAsync(order.Id)).ReturnsAsync(order);
        _orderRepo.Setup(r => r.Update(It.IsAny<Order>()));
        _userRepo.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync((User?)null);

        await _sut.CancelOrderAsync(order.Id, userId);

        // Wallet should never be touched for a pure COD order
        _walletRepo.Verify(w => w.GetByUserIdAsync(It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task CancelOrder_CreditsWalletUsedAmount_WhenCodOrderWithPartialWallet()
    {
        var userId = Guid.NewGuid();
        var order = Order.Create(userId, "123 Street", "COD");
        order.TotalAmount = 500;
        order.WalletAmountUsed = 100; // user paid ₹100 from wallet on a COD order

        var wallet = Wallet.Create(userId);
        wallet.Credit(200);

        _orderRepo.Setup(r => r.GetByIdWithItemsAsync(order.Id)).ReturnsAsync(order);
        _orderRepo.Setup(r => r.Update(It.IsAny<Order>()));
        _walletRepo.Setup(r => r.GetByUserIdAsync(userId)).ReturnsAsync(wallet);
        _walletRepo.Setup(r => r.Update(It.IsAny<Wallet>()));
        _walletRepo.Setup(r => r.AddTransactionAsync(It.IsAny<WalletTransaction>())).Returns(Task.CompletedTask);
        _userRepo.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync((User?)null);

        await _sut.CancelOrderAsync(order.Id, userId);

        wallet.Balance.Should().Be(300); // 200 + 100 refund
    }

    [Fact]
    public async Task CancelOrder_CreditsFullTotal_WhenOnlinePaymentOrder()
    {
        var userId = Guid.NewGuid();
        var order = Order.Create(userId, "123 Street", "Razorpay");
        order.TotalAmount = 1000;
        order.WalletAmountUsed = 0;

        var wallet = Wallet.Create(userId);

        _orderRepo.Setup(r => r.GetByIdWithItemsAsync(order.Id)).ReturnsAsync(order);
        _orderRepo.Setup(r => r.Update(It.IsAny<Order>()));
        _walletRepo.Setup(r => r.GetByUserIdAsync(userId)).ReturnsAsync(wallet);
        _walletRepo.Setup(r => r.Update(It.IsAny<Wallet>()));
        _walletRepo.Setup(r => r.AddTransactionAsync(It.IsAny<WalletTransaction>())).Returns(Task.CompletedTask);
        _userRepo.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync((User?)null);

        await _sut.CancelOrderAsync(order.Id, userId);

        wallet.Balance.Should().Be(1000); // full refund for online payment
    }

    // ── Phase 1 — Atomic inventory tests ─────────────────────────────────────

    [Fact]
    public async Task Create_ThrowsAppException_WhenAtomicDeductReturnsFalse_VariantSoldOut()
    {
        var variantId = Guid.NewGuid();
        var product = Product.Create("Shirt", "desc", 999, null, CategoryId, BrandId, "img.jpg", 10, SellerId);
        var variant = ProductVariant.Create(product.Id, "{\"Size\":\"M\"}", 1, null);

        _productRepo.Setup(r => r.GetByIdAsync(product.Id)).ReturnsAsync(product);
        _variantRepo.Setup(r => r.GetByIdAsync(variant.Id)).ReturnsAsync(variant);
        // Simulate race condition: another thread just bought the last unit — atomic SQL returns 0 rows
        _variantRepo.Setup(r => r.AtomicDeductStockAsync(variant.Id, 1)).ReturnsAsync(false);

        var act = () => _sut.CreateAsync(Guid.NewGuid(),
            BuildOrderDto([new CreateOrderItemDto(product.Id, 1, variant.Id)]));

        await act.Should().ThrowAsync<AppException>().WithMessage("*sold out*");
    }

    [Fact]
    public async Task Create_ThrowsAppException_WhenVariantStockInsufficientBeforeTransaction()
    {
        var product = Product.Create("Shoes", "desc", 3000, null, CategoryId, BrandId, "img.jpg", 10, SellerId);
        var variant = ProductVariant.Create(product.Id, "{\"Size\":\"8\"}", 2, null);

        _productRepo.Setup(r => r.GetByIdAsync(product.Id)).ReturnsAsync(product);
        _variantRepo.Setup(r => r.GetByIdAsync(variant.Id)).ReturnsAsync(variant);

        var act = () => _sut.CreateAsync(Guid.NewGuid(),
            BuildOrderDto([new CreateOrderItemDto(product.Id, 5, variant.Id)])); // 5 > 2 available

        await act.Should().ThrowAsync<AppException>().WithMessage("*Insufficient stock*");
        // Transaction should never have been opened
        _uow.Verify(u => u.BeginTransactionAsync(), Times.Never);
    }

    [Fact]
    public async Task Create_RollsBackTransaction_WhenAtomicDeductFails()
    {
        var product = Product.Create("Watch", "desc", 5000, null, CategoryId, BrandId, "img.jpg", 10, SellerId);
        var variant = ProductVariant.Create(product.Id, "{\"Color\":\"Black\"}", 1, null);

        _productRepo.Setup(r => r.GetByIdAsync(product.Id)).ReturnsAsync(product);
        _variantRepo.Setup(r => r.GetByIdAsync(variant.Id)).ReturnsAsync(variant);
        _variantRepo.Setup(r => r.AtomicDeductStockAsync(variant.Id, 1)).ReturnsAsync(false);

        var act = () => _sut.CreateAsync(Guid.NewGuid(),
            BuildOrderDto([new CreateOrderItemDto(product.Id, 1, variant.Id)]));

        await act.Should().ThrowAsync<AppException>();
        _tx.Verify(t => t.RollbackAsync(), Times.Once);
        _tx.Verify(t => t.CommitAsync(), Times.Never);
    }

    [Fact]
    public async Task CancelOrder_RestoresVariantStock_ForEachVariantItem()
    {
        var userId = Guid.NewGuid();
        var variantId = Guid.NewGuid();

        var order = Order.Create(userId, "123 Street", "UPI");
        order.TotalAmount = 1000;
        var item = OrderItem.Create(order.Id, Guid.NewGuid(), "Shirt", 1000, 2, variantId, "M");
        order.Items.Add(item);

        var variant = ProductVariant.Create(Guid.NewGuid(), "{\"Size\":\"M\"}", 5, null);
        var wallet = Wallet.Create(userId);
        _orderRepo.Setup(r => r.GetByIdWithItemsAsync(order.Id)).ReturnsAsync(order);
        _orderRepo.Setup(r => r.Update(It.IsAny<Order>()));
        _variantRepo.Setup(r => r.GetByIdAsync(variantId)).ReturnsAsync(variant);
        _walletRepo.Setup(r => r.GetByUserIdAsync(userId)).ReturnsAsync(wallet);
        _walletRepo.Setup(r => r.Update(It.IsAny<Wallet>()));
        _walletRepo.Setup(r => r.AddTransactionAsync(It.IsAny<WalletTransaction>())).Returns(Task.CompletedTask);
        _userRepo.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync((User?)null);

        await _sut.CancelOrderAsync(order.Id, userId);

        // Stock should be restored for the variant item (qty=2)
        _variantRepo.Verify(r => r.RestoreStockAsync(variantId, 2), Times.Once);
    }

    [Fact]
    public async Task Create_RecordsPurchaseAudit_WhenVariantOrderSucceeds()
    {
        var product = Product.Create("Laptop", "desc", 50000, null, CategoryId, BrandId, "img.jpg", 10, SellerId);
        var variant = ProductVariant.Create(product.Id, "{\"RAM\":\"16GB\"}", 5, null);

        _productRepo.Setup(r => r.GetByIdAsync(product.Id)).ReturnsAsync(product);
        _variantRepo.Setup(r => r.GetByIdAsync(variant.Id)).ReturnsAsync(variant);
        _variantRepo.Setup(r => r.AtomicDeductStockAsync(variant.Id, 2)).ReturnsAsync(true);

        await _sut.CreateAsync(Guid.NewGuid(),
            BuildOrderDto([new CreateOrderItemDto(product.Id, 2, variant.Id)]));

        _inventory.Verify(s => s.RecordAsync(
            variant.Id,
            PrakashMart.Domain.Enums.InventoryChangeType.Purchase,
            5,   // before
            3,   // after (5 - 2)
            It.IsAny<string>(),
            It.IsAny<Guid?>(),
            It.IsAny<Guid?>()), Times.Once);
    }

    [Fact]
    public async Task CancelOrder_RecordsCancellationAudit_WhenVariantStockRestored()
    {
        var userId = Guid.NewGuid();
        var variantId = Guid.NewGuid();

        var order = Order.Create(userId, "123 Street", "UPI");
        order.TotalAmount = 1000;
        order.WalletAmountUsed = 0;
        var item = OrderItem.Create(order.Id, Guid.NewGuid(), "Phone", 500, 2, variantId, "Black");
        order.Items.Add(item);

        var variant = ProductVariant.Create(Guid.NewGuid(), "{\"Color\":\"Black\"}", 3, null);
        var wallet = Wallet.Create(userId);

        _orderRepo.Setup(r => r.GetByIdWithItemsAsync(order.Id)).ReturnsAsync(order);
        _orderRepo.Setup(r => r.Update(It.IsAny<Order>()));
        _variantRepo.Setup(r => r.GetByIdAsync(variantId)).ReturnsAsync(variant);
        _walletRepo.Setup(r => r.GetByUserIdAsync(userId)).ReturnsAsync(wallet);
        _walletRepo.Setup(r => r.Update(It.IsAny<Wallet>()));
        _walletRepo.Setup(r => r.AddTransactionAsync(It.IsAny<WalletTransaction>())).Returns(Task.CompletedTask);
        _userRepo.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync((User?)null);

        await _sut.CancelOrderAsync(order.Id, userId);

        _inventory.Verify(s => s.RecordAsync(
            variantId,
            PrakashMart.Domain.Enums.InventoryChangeType.Cancellation,
            3,  // before (variant.Stock)
            5,  // after (3 + 2)
            It.IsAny<string>(),
            order.Id,
            userId), Times.Once);
    }

    // ── Reservation-order conflict fix ────────────────────────────────────────

    [Fact]
    public async Task Create_UsesAtomicDeductWithReservation_WhenUserHasActiveReservationForVariant()
    {
        var userId = Guid.NewGuid();
        var product = Product.Create("Shoes", "desc", 3000, null, CategoryId, BrandId, "img.jpg", 10, SellerId);
        var variant = ProductVariant.Create(product.Id, "{\"Size\":\"8\"}", 5, null);

        // Simulate: user reserved 2 units of this variant
        _cartReservation.Setup(s => s.GetStatusAsync(userId))
            .ReturnsAsync(new CartReservationStatusDto(true, DateTime.UtcNow.AddMinutes(10), 600,
                [new ReservedItemSummaryDto(variant.Id, "Size 8", "SKU-001", 2)]));

        _productRepo.Setup(r => r.GetByIdAsync(product.Id)).ReturnsAsync(product);
        _variantRepo.Setup(r => r.GetByIdAsync(variant.Id)).ReturnsAsync(variant);

        await _sut.CreateAsync(userId, BuildOrderDto([new CreateOrderItemDto(product.Id, 2, variant.Id)]));

        // Reservation path: releases reservation AND deducts stock atomically
        _variantRepo.Verify(r => r.AtomicDeductWithReservationAsync(variant.Id, 2), Times.Once);
        _variantRepo.Verify(r => r.AtomicDeductStockAsync(It.IsAny<Guid>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task Create_UsesStandardDeduct_WhenUserHasNoReservationForVariant()
    {
        var product = Product.Create("Shoes", "desc", 3000, null, CategoryId, BrandId, "img.jpg", 10, SellerId);
        var variant = ProductVariant.Create(product.Id, "{\"Size\":\"9\"}", 5, null);

        // No reservation for this variant
        _productRepo.Setup(r => r.GetByIdAsync(product.Id)).ReturnsAsync(product);
        _variantRepo.Setup(r => r.GetByIdAsync(variant.Id)).ReturnsAsync(variant);

        await _sut.CreateAsync(Guid.NewGuid(), BuildOrderDto([new CreateOrderItemDto(product.Id, 2, variant.Id)]));

        _variantRepo.Verify(r => r.AtomicDeductStockAsync(variant.Id, 2), Times.Once);
        _variantRepo.Verify(r => r.AtomicDeductWithReservationAsync(It.IsAny<Guid>(), It.IsAny<int>()), Times.Never);
    }
}
