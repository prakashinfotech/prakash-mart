using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace PrakashMart.Infrastructure.Persistence.Repositories;

public class CartRepository(AppDbContext context) : BaseRepository<Cart>(context), ICartRepository
{
    public async Task<Cart?> GetByUserIdWithItemsAsync(Guid userId)
        => await DbSet
            .Include(c => c.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(c => c.UserId == userId);
}
