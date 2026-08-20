using PrakashMart.Application.Common.Exceptions;
using PrakashMart.Application.DTOs.Returns;
using PrakashMart.Application.Interfaces;
using PrakashMart.Application.Services;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Enums;
using PrakashMart.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace Application.Tests.Returns;

public class OrderReturnServiceTests
{
    private readonly Mock<IOrderReturnRepository> _returnRepo = new();
    private readonly Mock<IOrderRepository> _orderRepo = new();
    private readonly Mock<IProductRepository> _productRepo = new();
    private readonly Mock<IProductVariantRepository> _variantRepo = new();
    private readonly Mock<IWalletService> _walletService = new();
    private readonly Mock<IInventoryService> _inventory = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly OrderReturnService _sut;

    private static readonly Guid CustomerId = Guid.NewGuid();
    private static readonly Guid SellerId = Guid.NewGuid();
    private static readonly Guid CategoryId = Guid.NewGuid();
    private static readonly Guid BrandId = Guid.NewGuid();

    public OrderReturnServiceTests()
    {
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _returnRepo.Setup(r => r.AddAsync(It.IsAny<OrderReturn>())).Returns(Task.CompletedTask);
        _walletService.Setup(w => w.CreditAsync(It.IsAny<Guid>(), It.IsAny<decimal>(), It.IsAny<string>(), null))
            .Returns(Task.CompletedTask);
        _variantRepo.Setup(r => r.RestoreStockAsync(It.IsAny<Guid>(), It.IsAny<int>())).Returns(Task.CompletedTask);
        _inventory.Setup(s => s.RecordAsync(It.IsAny<Guid>(), It.IsAny<PrakashMart.Domain.Enums.InventoryChangeType>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>(), It.IsAny<Guid?>(), It.IsAny<Guid?>())).Returns(Task.CompletedTask);
        _sut = new OrderReturnService(_returnRepo.Object, _orderRepo.Object, _productRepo.Object, _variantRepo.Object, _walletService.Object, _inventory.Object, _uow.Object);
    }

    private static Order BuildDeliveredOrder(Guid userId, decimal total = 500)
    {
        var order = Order.Create(userId, "123 Street", "COD");
        order.UpdateStatus(OrderStatus.Delivered);
        order.TotalAmount = total;
        return order;
    }

    // ── RequestReturnAsync ────────────────────────────────────────────────────

    [Fact]
    public async Task RequestReturn_ThrowsNotFoundException_WhenOrderDoesNotExist()
    {
        _orderRepo.Setup(r => r.GetByIdWithItemsAsync(It.IsAny<Guid>())).ReturnsAsync((Order?)null);

        var act = () => _sut.RequestReturnAsync(Guid.NewGuid(), CustomerId, new CreateReturnRequestDto("Defective"));

        await act.Should().ThrowAsync<NotFoundException>().WithMessage("*Order not found*");
    }

    [Fact]
    public async Task RequestReturn_ThrowsForbiddenException_WhenUserDoesNotOwnOrder()
    {
        var order = BuildDeliveredOrder(Guid.NewGuid());
        _orderRepo.Setup(r => r.GetByIdWithItemsAsync(order.Id)).ReturnsAsync(order);

        var act = () => _sut.RequestReturnAsync(order.Id, CustomerId, new CreateReturnRequestDto("Defective"));

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task RequestReturn_ThrowsAppException_WhenOrderIsNotDelivered()
    {
        var order = Order.Create(CustomerId, "123 Street", "COD");
        order.TotalAmount = 500;
        // Status stays Pending — not Delivered
        _orderRepo.Setup(r => r.GetByIdWithItemsAsync(order.Id)).ReturnsAsync(order);

        var act = () => _sut.RequestReturnAsync(order.Id, CustomerId, new CreateReturnRequestDto("Changed mind"));

        await act.Should().ThrowAsync<AppException>().WithMessage("*delivered*");
    }

    [Fact]
    public async Task RequestReturn_ThrowsAppException_WhenReturnAlreadyExists()
    {
        var order = BuildDeliveredOrder(CustomerId);
        var existingReturn = OrderReturn.Create(order.Id, CustomerId, "Previous reason");

        _orderRepo.Setup(r => r.GetByIdWithItemsAsync(order.Id)).ReturnsAsync(order);
        _returnRepo.Setup(r => r.GetByOrderIdAsync(order.Id)).ReturnsAsync(existingReturn);

        var act = () => _sut.RequestReturnAsync(order.Id, CustomerId, new CreateReturnRequestDto("Defective"));

        await act.Should().ThrowAsync<AppException>().WithMessage("*already exists*");
    }

    [Fact]
    public async Task RequestReturn_Succeeds_WhenOrderIsDeliveredAndNoExistingReturn()
    {
        var order = BuildDeliveredOrder(CustomerId);

        _orderRepo.Setup(r => r.GetByIdWithItemsAsync(order.Id)).ReturnsAsync(order);
        _returnRepo.Setup(r => r.GetByOrderIdAsync(order.Id)).ReturnsAsync((OrderReturn?)null);

        var result = await _sut.RequestReturnAsync(order.Id, CustomerId, new CreateReturnRequestDto("Defective product"));

        result.Status.Should().Be("Pending");
        result.Reason.Should().Be("Defective product");
        result.OrderId.Should().Be(order.Id);
    }

    // ── ProcessReturnAsync ────────────────────────────────────────────────────

    [Fact]
    public async Task ProcessReturn_ThrowsAppException_WhenReturnAlreadyProcessed()
    {
        var @return = OrderReturn.Create(Guid.NewGuid(), CustomerId, "Defective");
        @return.Approve(); // already approved

        _returnRepo.Setup(r => r.GetByIdAsync(@return.Id)).ReturnsAsync(@return);

        var act = () => _sut.ProcessReturnAsync(@return.Id, SellerId, new ProcessReturnDto(true));

        await act.Should().ThrowAsync<AppException>().WithMessage("*already been processed*");
    }

    [Fact]
    public async Task ProcessReturn_ApproveSetsStatusApproved_AndCreditsWallet()
    {
        var orderId = Guid.NewGuid();
        var @return = OrderReturn.Create(orderId, CustomerId, "Defective");
        var product = Product.Create("Phone", "desc", 500, null, CategoryId, BrandId, "img.jpg", 10, SellerId);

        var order = BuildDeliveredOrder(CustomerId, 500);
        var item = OrderItem.Create(orderId, product.Id, "Phone", 500, 1);
        order.Items.Add(item);

        _returnRepo.Setup(r => r.GetByIdAsync(@return.Id)).ReturnsAsync(@return);
        _returnRepo.Setup(r => r.Update(It.IsAny<OrderReturn>()));
        _orderRepo.Setup(r => r.GetByIdWithItemsAsync(orderId)).ReturnsAsync(order);
        _productRepo.Setup(r => r.GetFilteredAsync(
            It.IsAny<string?>(), It.IsAny<Guid?>(), It.IsAny<decimal?>(),
            It.IsAny<decimal?>(), It.IsAny<int?>(), It.IsAny<string?>(), It.IsAny<string?>()))
            .ReturnsAsync([product]);

        var result = await _sut.ProcessReturnAsync(@return.Id, SellerId, new ProcessReturnDto(true));

        result.Status.Should().Be("Approved");
        _walletService.Verify(w => w.CreditAsync(CustomerId, It.IsAny<decimal>(), It.IsAny<string>(), null), Times.Once);
    }

    [Fact]
    public async Task ProcessReturn_RejectSetsStatusRejected_AndDoesNotCreditWallet()
    {
        var orderId = Guid.NewGuid();
        var @return = OrderReturn.Create(orderId, CustomerId, "Defective");
        var product = Product.Create("Phone", "desc", 500, null, CategoryId, BrandId, "img.jpg", 10, SellerId);

        var order = BuildDeliveredOrder(CustomerId, 500);
        var item = OrderItem.Create(orderId, product.Id, "Phone", 500, 1);
        order.Items.Add(item);

        _returnRepo.Setup(r => r.GetByIdAsync(@return.Id)).ReturnsAsync(@return);
        _returnRepo.Setup(r => r.Update(It.IsAny<OrderReturn>()));
        _orderRepo.Setup(r => r.GetByIdWithItemsAsync(orderId)).ReturnsAsync(order);
        _productRepo.Setup(r => r.GetFilteredAsync(
            It.IsAny<string?>(), It.IsAny<Guid?>(), It.IsAny<decimal?>(),
            It.IsAny<decimal?>(), It.IsAny<int?>(), It.IsAny<string?>(), It.IsAny<string?>()))
            .ReturnsAsync([product]);

        var result = await _sut.ProcessReturnAsync(@return.Id, SellerId, new ProcessReturnDto(false));

        result.Status.Should().Be("Rejected");
        _walletService.Verify(w => w.CreditAsync(It.IsAny<Guid>(), It.IsAny<decimal>(), It.IsAny<string>(), null), Times.Never);
    }
}
