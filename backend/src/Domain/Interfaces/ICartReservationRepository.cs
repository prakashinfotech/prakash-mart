using PrakashMart.Domain.Entities;

namespace PrakashMart.Domain.Interfaces;

public interface ICartReservationRepository
{
    Task AddAsync(CartReservation reservation);
    Task<IEnumerable<CartReservation>> GetActiveByUserAsync(Guid userId);
    Task<IEnumerable<CartReservation>> GetExpiredAsync();
    Task ReleaseByUserRawAsync(Guid userId);
}
