using PrakashMart.Application.DTOs.Reservations;

namespace PrakashMart.Application.Interfaces;

public interface ICartReservationService
{
    Task<CartReservationStatusDto> ReserveAsync(Guid userId, ReserveCartDto dto);
    Task ReleaseAsync(Guid userId);
    Task<CartReservationStatusDto> GetStatusAsync(Guid userId);
    Task CleanupExpiredAsync();
}
