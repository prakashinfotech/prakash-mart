using PrakashMart.Application.Common.Exceptions;
using PrakashMart.Application.DTOs.Reservations;
using PrakashMart.Application.Interfaces;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Enums;
using PrakashMart.Domain.Interfaces;

namespace PrakashMart.Application.Services;

public class CartReservationService(
    ICartReservationRepository reservationRepository,
    IProductVariantRepository variantRepository,
    IInventoryService inventoryService,
    IUnitOfWork unitOfWork) : ICartReservationService
{
    private const int WindowMinutes = 15;

    public async Task<CartReservationStatusDto> ReserveAsync(Guid userId, ReserveCartDto dto)
    {
        var items = dto.Items.ToList();
        if (items.Count == 0)
            throw new AppException("No items to reserve.");

        // Release any existing reservation before creating a fresh one
        await ReleaseAsync(userId);

        var expiresAt = DateTime.UtcNow.AddMinutes(WindowMinutes);
        var reserved = new List<(Guid variantId, int qty)>();

        foreach (var item in items)
        {
            var success = await variantRepository.AtomicReserveAsync(item.VariantId, item.Quantity);
            if (!success)
            {
                // Rollback all variants reserved so far in this call
                foreach (var (vid, q) in reserved)
                    await variantRepository.AtomicReleaseReservationAsync(vid, q);

                var variant = await variantRepository.GetByIdAsync(item.VariantId);
                var label = variant?.Label ?? item.VariantId.ToString()[..8];
                throw new AppException($"Insufficient stock for variant \"{label}\". It may have just sold out.");
            }
            reserved.Add((item.VariantId, item.Quantity));
        }

        var summaries = new List<ReservedItemSummaryDto>();

        foreach (var (variantId, qty) in reserved)
        {
            var reservation = CartReservation.Create(userId, variantId, qty, expiresAt);
            await reservationRepository.AddAsync(reservation);

            var variant = await variantRepository.GetByIdAsync(variantId);
            await inventoryService.RecordAsync(
                variantId, InventoryChangeType.Reservation,
                (variant?.Stock ?? 0) - (variant?.ReservedQuantity ?? 0) + qty,
                (variant?.Stock ?? 0) - (variant?.ReservedQuantity ?? 0),
                $"Cart reservation — {qty} unit(s) held for {WindowMinutes} min",
                createdBy: userId);

            summaries.Add(new ReservedItemSummaryDto(
                variantId,
                variant?.Label ?? string.Empty,
                variant?.SKU ?? string.Empty,
                qty));
        }

        await unitOfWork.SaveChangesAsync();

        return new CartReservationStatusDto(
            IsActive: true,
            ExpiresAt: expiresAt,
            SecondsRemaining: WindowMinutes * 60,
            Items: summaries);
    }

    public async Task ReleaseAsync(Guid userId)
    {
        var active = (await reservationRepository.GetActiveByUserAsync(userId)).ToList();
        if (active.Count == 0) return;

        foreach (var r in active)
        {
            await variantRepository.AtomicReleaseReservationAsync(r.ProductVariantId, r.Quantity);

            var variant = await variantRepository.GetByIdAsync(r.ProductVariantId);
            await inventoryService.RecordAsync(
                r.ProductVariantId, InventoryChangeType.ReservationRelease,
                variant?.Stock ?? 0,
                variant?.Stock ?? 0,
                "Cart reservation released",
                createdBy: userId);

            r.Release();
        }

        await unitOfWork.SaveChangesAsync();
    }

    public async Task<CartReservationStatusDto> GetStatusAsync(Guid userId)
    {
        var active = (await reservationRepository.GetActiveByUserAsync(userId)).ToList();
        var valid = active.Where(r => r.ExpiresAt > DateTime.UtcNow).ToList();

        if (valid.Count == 0)
            return new CartReservationStatusDto(false, null, 0, []);

        var earliest = valid.Min(r => r.ExpiresAt);
        var secondsLeft = Math.Max(0, (int)(earliest - DateTime.UtcNow).TotalSeconds);
        var items = valid.Select(r => new ReservedItemSummaryDto(
            r.ProductVariantId,
            r.Variant?.Label ?? string.Empty,
            r.Variant?.SKU ?? string.Empty,
            r.Quantity));

        return new CartReservationStatusDto(true, earliest, secondsLeft, items);
    }

    public async Task CleanupExpiredAsync()
    {
        var expired = (await reservationRepository.GetExpiredAsync()).ToList();
        if (expired.Count == 0) return;

        foreach (var r in expired)
        {
            await variantRepository.AtomicReleaseReservationAsync(r.ProductVariantId, r.Quantity);
            await inventoryService.RecordAsync(
                r.ProductVariantId, InventoryChangeType.ReservationRelease,
                0, 0,
                "Cart reservation expired — auto-released by cleanup job");
            r.Release();
        }

        await unitOfWork.SaveChangesAsync();
    }
}
