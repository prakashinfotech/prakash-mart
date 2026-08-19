using PrakashMart.Application.Common.Exceptions;
using PrakashMart.Application.DTOs.Returns;
using PrakashMart.Application.Interfaces;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Enums;
using PrakashMart.Domain.Interfaces;

namespace PrakashMart.Application.Services;

public class OrderReturnService(
    IOrderReturnRepository returnRepository,
    IOrderRepository orderRepository,
    IProductRepository productRepository,
    IProductVariantRepository variantRepository,
    IWalletService walletService,
    IInventoryService inventoryService,
    IUnitOfWork unitOfWork) : IOrderReturnService
{
    public async Task<OrderReturnDto> RequestReturnAsync(Guid orderId, Guid userId, CreateReturnRequestDto dto)
    {
        var order = await orderRepository.GetByIdWithItemsAsync(orderId)
            ?? throw new NotFoundException("Order not found.");

        if (order.UserId != userId)
            throw new ForbiddenException("Access denied.");

        if (order.Status != OrderStatus.Delivered)
            throw new AppException("Only delivered orders can be returned.");

        if (await returnRepository.GetByOrderIdAsync(orderId) != null)
            throw new AppException("A return request already exists for this order.");

        var @return = OrderReturn.Create(orderId, userId, dto.Reason);
        await returnRepository.AddAsync(@return);
        await unitOfWork.SaveChangesAsync();
        return Map(@return);
    }

    public async Task<OrderReturnDto> ProcessReturnAsync(Guid returnId, Guid sellerId, ProcessReturnDto dto)
    {
        var @return = await returnRepository.GetByIdAsync(returnId)
            ?? throw new NotFoundException("Return request not found.");

        if (@return.Status != ReturnStatus.Pending)
            throw new AppException("This return request has already been processed.");

        var order = await orderRepository.GetByIdWithItemsAsync(@return.OrderId)
            ?? throw new NotFoundException("Order not found.");

        var sellerProducts = (await productRepository.GetFilteredAsync(null, null, null, null, null))
            .Where(p => p.SellerId == sellerId)
            .Select(p => p.Id)
            .ToHashSet();

        var hasSellerItems = order.Items.Any(i => sellerProducts.Contains(i.ProductId));
        if (!hasSellerItems)
            throw new ForbiddenException("You can only process returns for your own products.");

        if (dto.Approve)
        {
            @return.Approve();
            var refundAmount = order.Items
                .Where(i => sellerProducts.Contains(i.ProductId))
                .Sum(i => i.UnitPrice * i.Quantity);
            await walletService.CreditAsync(@return.UserId, refundAmount, $"Refund for return on order {order.Id}");

            // Restore stock for variant items and record RETURN audit
            foreach (var item in order.Items.Where(i => i.VariantId.HasValue && sellerProducts.Contains(i.ProductId)))
            {
                var variantId = item.VariantId!.Value;
                var variant = await variantRepository.GetByIdAsync(variantId);
                var before = variant?.Stock ?? 0;
                await variantRepository.RestoreStockAsync(variantId, item.Quantity);
                await inventoryService.RecordAsync(
                    variantId, InventoryChangeType.Return,
                    before, before + item.Quantity,
                    $"Stock restored — return approved for order #{order.Id.ToString()[..8].ToUpper()}",
                    referenceId: @return.Id, createdBy: sellerId);
            }
        }
        else
        {
            @return.Reject();
        }

        returnRepository.Update(@return);
        await unitOfWork.SaveChangesAsync();
        return Map(@return);
    }

    public async Task<IEnumerable<OrderReturnDto>> GetSellerReturnsAsync(Guid sellerId)
    {
        var returns = await returnRepository.GetBySellerIdAsync(sellerId);
        return returns.Select(Map);
    }

    public async Task<OrderReturnDto?> GetByOrderIdAsync(Guid orderId, Guid userId)
    {
        var @return = await returnRepository.GetByOrderIdAsync(orderId);
        if (@return == null) return null;
        var order = await orderRepository.GetByIdWithItemsAsync(orderId);
        if (order?.UserId != userId) throw new ForbiddenException("Access denied.");
        return Map(@return);
    }

    private static OrderReturnDto Map(OrderReturn r) =>
        new(r.Id, r.OrderId, r.Reason, r.Status.ToString(), r.CreatedAt);
}
