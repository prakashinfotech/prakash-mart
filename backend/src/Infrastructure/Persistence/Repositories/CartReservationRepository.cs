using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace PrakashMart.Infrastructure.Persistence.Repositories;

public class CartReservationRepository(AppDbContext context) : ICartReservationRepository
{
    public async Task AddAsync(CartReservation reservation)
        => await context.CartReservations.AddAsync(reservation);

    public async Task<IEnumerable<CartReservation>> GetActiveByUserAsync(Guid userId)
        => await context.CartReservations
            .Include(r => r.Variant)
            .Where(r => r.UserId == userId && !r.IsReleased)
            .ToListAsync();

    public async Task<IEnumerable<CartReservation>> GetExpiredAsync()
        => await context.CartReservations
            .Include(r => r.Variant)
            .Where(r => !r.IsReleased && r.ExpiresAt < DateTime.UtcNow)
            .ToListAsync();

    // Raw SQL for fast bulk-release — the service handles ReservedQuantity decrements before calling this.
    public async Task ReleaseByUserRawAsync(Guid userId)
        => await context.Database.ExecuteSqlRawAsync(
            "UPDATE CartReservations SET IsReleased = 1, ReleasedAt = SYSUTCDATETIME(), UpdatedAt = SYSUTCDATETIME() " +
            "WHERE UserId = {0} AND IsReleased = 0",
            userId);
}
