using PrakashMart.Application.Common.Exceptions;
using PrakashMart.Application.DTOs.Orders;
using PrakashMart.Application.Interfaces;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Enums;
using PrakashMart.Domain.Interfaces;
using InventoryChangeType = PrakashMart.Domain.Enums.InventoryChangeType;

namespace PrakashMart.Application.Services;

public class OrderService(
    IOrderRepository orderRepository,
    IProductRepository productRepository,
    IProductVariantRepository variantRepository,
    ICouponRepository couponRepository,
    IUserRepository userRepository,
    IWalletRepository walletRepository,
    IEmailService emailService,
    IUnitOfWork unitOfWork,
    IInventoryService inventoryService,
    ICartReservationService cartReservationService,
    IPushNotificationService pushNotificationService) : IOrderService
{
    public async Task<IEnumerable<OrderDto>> GetUserOrdersAsync(Guid userId)
    {
        var orders = await orderRepository.GetByUserIdAsync(userId);
        return orders.Select(MapOrder);
    }

    public async Task<IEnumerable<OrderDto>> GetAllOrdersAsync()
    {
        var orders = await orderRepository.GetAllAsync();
        return orders.Select(MapOrder);
    }

    public async Task<OrderDto> GetByIdAsync(Guid orderId, Guid userId)
    {
        var order = await orderRepository.GetByIdWithItemsAsync(orderId)
            ?? throw new NotFoundException("Order not found.");

        if (order.UserId != userId)
            throw new ForbiddenException("Access denied.");

        return MapOrder(order);
    }

    public async Task<OrderDto> CreateAsync(Guid userId, CreateOrderDto dto)
    {
        if (!dto.Items.Any())
            throw new AppException("Order must contain at least one item.");

        // Fetch the user's active reservations so we can pick the correct deduction path per variant
        var reservationStatus = await cartReservationService.GetStatusAsync(userId);
        var reservedQtyByVariant = reservationStatus.Items
            .ToDictionary(i => i.VariantId, i => i.Quantity);

        // Pre-validate all items before opening the transaction — fail fast on obvious errors
        var itemDetails = new List<(CreateOrderItemDto Item, Product Product, ProductVariant? Variant)>();
        foreach (var item in dto.Items)
        {
            var product = await productRepository.GetByIdAsync(item.ProductId)
                ?? throw new NotFoundException("Product not found.");

            ProductVariant? variant = null;
            if (item.VariantId.HasValue)
            {
                variant = await variantRepository.GetByIdAsync(item.VariantId.Value)
                    ?? throw new NotFoundException($"Variant not found for \"{product.Name}\".");

                if (!variant.IsActive)
                    throw new AppException($"\"{product.Name}\" ({variant.Label}) is no longer available.");

                // If the user has a valid reservation for this variant, check total stock (not AvailableStock)
                // because their reservation is already "consuming" ReservedQuantity.
                bool hasReservation = reservedQtyByVariant.TryGetValue(variant.Id, out var rQty) && rQty >= item.Quantity;
                if (!hasReservation && !variant.CanFulfill(item.Quantity))
                    throw new AppException($"Insufficient stock for \"{product.Name}\" ({variant.Label}). Available: {variant.AvailableStock}.");
                if (hasReservation && variant.Stock < item.Quantity)
                    throw new AppException($"Insufficient stock for \"{product.Name}\" ({variant.Label}).");
            }
            else
            {
                if (product.Stock < item.Quantity)
                    throw new AppException($"Insufficient stock for \"{product.Name}\".");
            }

            itemDetails.Add((item, product, variant));
        }

        // Open a DB transaction — all stock deductions, wallet debit, and order creation are atomic
        await using var tx = await unitOfWork.BeginTransactionAsync();
        try
        {
            var address = $"{dto.ShippingAddress}, {dto.City}, {dto.State} {dto.PostalCode}";
            var order = Order.Create(userId, address, dto.PaymentMethod);

            foreach (var (item, product, variant) in itemDetails)
            {
                decimal unitPrice = product.Price;
                string? variantLabel = null;

                if (variant is not null)
                {
                    // If the user pre-reserved this variant, deduct stock AND release the reservation atomically.
                    // Otherwise fall back to the standard available-stock check.
                    bool hasReservation = reservedQtyByVariant.TryGetValue(variant.Id, out var rQty) && rQty >= item.Quantity;
                    var deducted = hasReservation
                        ? await variantRepository.AtomicDeductWithReservationAsync(variant.Id, item.Quantity)
                        : await variantRepository.AtomicDeductStockAsync(variant.Id, item.Quantity);
                    if (!deducted)
                        throw new AppException($"Insufficient stock for \"{product.Name}\" ({variant.Label}). It may have just sold out.");

                    // variant.Stock is the value from pre-validation — accurate "before" for the audit
                    await inventoryService.RecordAsync(
                        variant.Id, InventoryChangeType.Purchase,
                        variant.Stock, variant.Stock - item.Quantity,
                        $"Sold {item.Quantity} unit(s) — order #{order.Id.ToString()[..8].ToUpper()}",
                        referenceId: order.Id, createdBy: userId);

                    unitPrice = variant.PriceOverride ?? product.Price;
                    variantLabel = variant.Label;
                }
                else
                {
                    // Non-variant product: use EF update (these are less concurrent in practice)
                    product.Update(product.Name, product.Description, product.Price, product.DiscountPercent,
                        product.CategoryId, product.BrandId, product.ImageUrl, product.Stock - item.Quantity);
                    productRepository.Update(product);
                }

                order.Items.Add(OrderItem.Create(
                    order.Id, item.ProductId, product.Name,
                    unitPrice, item.Quantity, item.VariantId, variantLabel));
            }

            var subtotal = order.Items.Sum(i => i.UnitPrice * i.Quantity);

            if (!string.IsNullOrWhiteSpace(dto.CouponCode))
            {
                var coupon = await couponRepository.GetByCodeAsync(dto.CouponCode.ToUpperInvariant());
                if (coupon is not null && coupon.IsValid())
                {
                    order.CouponCode = coupon.Code;
                    order.DiscountAmount = Math.Round(subtotal * coupon.DiscountPercent / 100, 2);
                    coupon.Redeem();
                    couponRepository.Update(coupon);
                }
            }

            order.TotalAmount = subtotal - order.DiscountAmount;

            if (!string.IsNullOrWhiteSpace(dto.RazorpayOrderId))
                order.RazorpayOrderId = dto.RazorpayOrderId;
            if (!string.IsNullOrWhiteSpace(dto.RazorpayPaymentId))
                order.RazorpayPaymentId = dto.RazorpayPaymentId;

            if (dto.WalletAmount > 0)
            {
                var walletAmount = Math.Min(dto.WalletAmount, order.TotalAmount);
                var wallet = await walletRepository.GetByUserIdAsync(userId);
                if (wallet is null || wallet.Balance < walletAmount)
                    throw new AppException("Insufficient wallet balance.");
                wallet.Debit(walletAmount);
                walletRepository.Update(wallet);
                await walletRepository.AddTransactionAsync(WalletTransaction.Create(
                    wallet.Id, walletAmount, TransactionType.Debit,
                    $"Payment for order #{order.Id.ToString()[..8].ToUpper()}", order.Id));
                order.WalletAmountUsed = walletAmount;
            }

            await orderRepository.AddAsync(order);
            await unitOfWork.SaveChangesAsync();
            await tx.CommitAsync();

            var orderDto = MapOrder(order);

            // Release cart reservation after successful order — fire-and-forget (order is already committed)
            _ = Task.Run(async () =>
            {
                try { await cartReservationService.ReleaseAsync(userId); }
                catch { /* non-critical — cleanup job handles stragglers */ }
            });

            var user = await userRepository.GetByIdAsync(userId);
            if (user is not null)
                _ = emailService.SendOrderConfirmationAsync(user.Email, user.Name, orderDto);

            return orderDto;
        }
        catch
        {
            // Swallow rollback errors: SQL Server may have already auto-aborted the transaction
            // (e.g. on a constraint violation or deadlock), making the SqlTransaction zombie.
            // The original exception is what matters — rethrow it regardless.
            try { await tx.RollbackAsync(); } catch { /* already rolled back */ }
            throw;
        }
    }

    public async Task<OrderDto> UpdateStatusAsync(Guid orderId, string status, Guid requesterId)
    {
        var order = await orderRepository.GetByIdWithItemsAsync(orderId)
            ?? throw new NotFoundException("Order not found.");

        if (!Enum.TryParse<OrderStatus>(status, true, out var newStatus))
            throw new AppException($"Invalid status: {status}.");

        decimal walletCredited = 0;
        if (newStatus == OrderStatus.Cancelled && order.Status != OrderStatus.Cancelled)
        {
            walletCredited = await ProcessCancellationRefundAsync(order);
            await RestoreOrderStockAsync(order, actorId: requesterId);
        }

        order.UpdateStatus(newStatus);
        orderRepository.Update(order);
        await unitOfWork.SaveChangesAsync();

        var orderDto = MapOrder(order);
        var user = await userRepository.GetByIdAsync(order.UserId);
        if (user is not null)
        {
            if (newStatus == OrderStatus.Cancelled)
                _ = emailService.SendOrderCancelledAsync(user.Email, user.Name, orderDto, walletCredited);
            else
                _ = emailService.SendOrderStatusUpdateAsync(user.Email, user.Name, orderDto);
        }

        var (pushTitle, pushBody) = newStatus switch
        {
            OrderStatus.Processing => ("Order Confirmed", "Your order is being prepared."),
            OrderStatus.Shipped    => ("Order Shipped!", "Your order is on its way."),
            OrderStatus.Delivered  => ("Order Delivered!", "Your order has been delivered."),
            OrderStatus.Cancelled  => ("Order Cancelled", "Your order has been cancelled."),
            _                      => ("Order Update", $"Your order is now {newStatus}.")
        };
        await pushNotificationService.SendToUserAsync(order.UserId, pushTitle, pushBody, $"/orders/{order.Id}");

        return orderDto;
    }

    public async Task<OrderDto> CancelOrderAsync(Guid orderId, Guid userId)
    {
        var order = await orderRepository.GetByIdWithItemsAsync(orderId)
            ?? throw new NotFoundException("Order not found.");

        if (order.UserId != userId)
            throw new ForbiddenException("Access denied.");

        if (order.Status != OrderStatus.Pending && order.Status != OrderStatus.Processing)
            throw new AppException("Only Pending or Processing orders can be cancelled.");

        var walletCredited = await ProcessCancellationRefundAsync(order);
        await RestoreOrderStockAsync(order, actorId: userId);
        order.UpdateStatus(OrderStatus.Cancelled);
        orderRepository.Update(order);
        await unitOfWork.SaveChangesAsync();

        var orderDto = MapOrder(order);
        var user = await userRepository.GetByIdAsync(userId);
        if (user is not null)
            _ = emailService.SendOrderCancelledAsync(user.Email, user.Name, orderDto, walletCredited);
        await pushNotificationService.SendToUserAsync(order.UserId, "Order Cancelled", "Your order has been cancelled.", $"/orders/{order.Id}");

        return orderDto;
    }

    private async Task RestoreOrderStockAsync(Order order, Guid? actorId = null)
    {
        foreach (var item in order.Items.Where(i => i.VariantId.HasValue))
        {
            var variantId = item.VariantId!.Value;
            // Load current stock before restoring — gives accurate "before" for the audit record
            var variant = await variantRepository.GetByIdAsync(variantId);
            var before = variant?.Stock ?? 0;
            await variantRepository.RestoreStockAsync(variantId, item.Quantity);
            await inventoryService.RecordAsync(
                variantId, InventoryChangeType.Cancellation,
                before, before + item.Quantity,
                $"Stock restored — order #{order.Id.ToString()[..8].ToUpper()} cancelled",
                referenceId: order.Id, createdBy: actorId);
        }
    }

    private async Task<decimal> ProcessCancellationRefundAsync(Order order)
    {
        var isCod = order.PaymentMethod is "COD" or "Cash on Delivery";
        var refundAmount = isCod
            ? order.WalletAmountUsed
            : order.TotalAmount;

        if (refundAmount <= 0) return 0;

        var wallet = await walletRepository.GetByUserIdAsync(order.UserId);
        if (wallet is null)
        {
            wallet = Wallet.Create(order.UserId);
            await walletRepository.AddAsync(wallet);
        }

        wallet.Credit(refundAmount);
        walletRepository.Update(wallet);
        await walletRepository.AddTransactionAsync(WalletTransaction.Create(
            wallet.Id, refundAmount, TransactionType.Credit,
            $"Refund for cancelled order #{order.Id.ToString()[..8].ToUpper()}", order.Id));

        return refundAmount;
    }

    private static OrderDto MapOrder(Order o) =>
        new(o.Id, o.Status.ToString(), o.ShippingAddress, string.Empty, string.Empty, string.Empty,
            o.PaymentMethod, o.TotalAmount,
            o.Items.Select(i => new OrderItemDto(i.ProductId, i.ProductName, i.UnitPrice, i.Quantity, i.UnitPrice * i.Quantity, i.VariantLabel)),
            o.CreatedAt, o.CouponCode, o.DiscountAmount, o.WalletAmountUsed, o.RazorpayPaymentId);
}
