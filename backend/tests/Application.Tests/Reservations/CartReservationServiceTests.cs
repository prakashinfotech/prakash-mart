using PrakashMart.Application.Common.Exceptions;
using PrakashMart.Application.DTOs.Reservations;
using PrakashMart.Application.Interfaces;
using PrakashMart.Application.Services;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace Application.Tests.Reservations;

public class CartReservationServiceTests
{
    private readonly Mock<ICartReservationRepository> _reservationRepo = new();
    private readonly Mock<IProductVariantRepository> _variantRepo = new();
    private readonly Mock<IInventoryService> _inventory = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly CartReservationService _sut;

    private static readonly Guid UserId = Guid.NewGuid();
    private static readonly Guid ProductId = Guid.NewGuid();

    public CartReservationServiceTests()
    {
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _reservationRepo.Setup(r => r.AddAsync(It.IsAny<CartReservation>())).Returns(Task.CompletedTask);
        _inventory.Setup(s => s.RecordAsync(
            It.IsAny<Guid>(), It.IsAny<PrakashMart.Domain.Enums.InventoryChangeType>(),
            It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>(),
            It.IsAny<Guid?>(), It.IsAny<Guid?>())).Returns(Task.CompletedTask);
        _sut = new CartReservationService(_reservationRepo.Object, _variantRepo.Object, _inventory.Object, _uow.Object);
    }

    private static ProductVariant MakeVariant(int stock = 10, int reserved = 0)
    {
        var v = ProductVariant.Create(ProductId, "{\"Size\":\"M\"}", stock, null);
        return v;
    }

    [Fact]
    public async Task ReserveAsync_ThrowsAppException_WhenNoItemsProvided()
    {
        _reservationRepo.Setup(r => r.GetActiveByUserAsync(UserId)).ReturnsAsync([]);

        var act = () => _sut.ReserveAsync(UserId, new ReserveCartDto([]));

        await act.Should().ThrowAsync<AppException>().WithMessage("*No items*");
    }

    [Fact]
    public async Task ReserveAsync_ThrowsAppException_WhenVariantOutOfStock()
    {
        var variantId = Guid.NewGuid();
        _reservationRepo.Setup(r => r.GetActiveByUserAsync(UserId)).ReturnsAsync([]);
        _variantRepo.Setup(r => r.AtomicReserveAsync(variantId, 2)).ReturnsAsync(false);
        _variantRepo.Setup(r => r.GetByIdAsync(variantId)).ReturnsAsync(MakeVariant(stock: 1));

        var dto = new ReserveCartDto([new CartReservationItemDto(variantId, 2)]);
        var act = () => _sut.ReserveAsync(UserId, dto);

        await act.Should().ThrowAsync<AppException>().WithMessage("*Insufficient stock*");
    }

    [Fact]
    public async Task ReserveAsync_CreatesReservationAndReturnsStatus_WhenSuccessful()
    {
        var variantId = Guid.NewGuid();
        var variant = MakeVariant(stock: 10);
        _reservationRepo.Setup(r => r.GetActiveByUserAsync(UserId)).ReturnsAsync([]);
        _variantRepo.Setup(r => r.AtomicReserveAsync(variantId, 3)).ReturnsAsync(true);
        _variantRepo.Setup(r => r.GetByIdAsync(variantId)).ReturnsAsync(variant);

        var dto = new ReserveCartDto([new CartReservationItemDto(variantId, 3)]);
        var result = await _sut.ReserveAsync(UserId, dto);

        result.IsActive.Should().BeTrue();
        result.ExpiresAt.Should().NotBeNull();
        result.SecondsRemaining.Should().BeGreaterThan(0);
        result.Items.Should().HaveCount(1);
        _reservationRepo.Verify(r => r.AddAsync(It.IsAny<CartReservation>()), Times.Once);
        _uow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ReleaseAsync_ReleasesReservedQuantityAndMarksReleased()
    {
        var variantId = Guid.NewGuid();
        var variant = MakeVariant(stock: 10);
        var reservation = CartReservation.Create(UserId, variantId, 3, DateTime.UtcNow.AddMinutes(10));

        _reservationRepo.Setup(r => r.GetActiveByUserAsync(UserId)).ReturnsAsync([reservation]);
        _variantRepo.Setup(r => r.AtomicReleaseReservationAsync(variantId, 3)).Returns(Task.CompletedTask);
        _variantRepo.Setup(r => r.GetByIdAsync(variantId)).ReturnsAsync(variant);

        await _sut.ReleaseAsync(UserId);

        _variantRepo.Verify(r => r.AtomicReleaseReservationAsync(variantId, 3), Times.Once);
        _uow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetStatusAsync_ReturnsInactive_WhenNoActiveReservations()
    {
        _reservationRepo.Setup(r => r.GetActiveByUserAsync(UserId)).ReturnsAsync([]);

        var result = await _sut.GetStatusAsync(UserId);

        result.IsActive.Should().BeFalse();
        result.SecondsRemaining.Should().Be(0);
        result.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task CleanupExpiredAsync_ReleasesExpiredReservations()
    {
        var variantId = Guid.NewGuid();
        var expired = CartReservation.Create(Guid.NewGuid(), variantId, 2, DateTime.UtcNow.AddMinutes(-5));

        _reservationRepo.Setup(r => r.GetExpiredAsync()).ReturnsAsync([expired]);
        _variantRepo.Setup(r => r.AtomicReleaseReservationAsync(variantId, 2)).Returns(Task.CompletedTask);

        await _sut.CleanupExpiredAsync();

        _variantRepo.Verify(r => r.AtomicReleaseReservationAsync(variantId, 2), Times.Once);
        _uow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
