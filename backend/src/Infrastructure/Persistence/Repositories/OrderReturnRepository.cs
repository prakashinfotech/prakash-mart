using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace PrakashMart.Infrastructure.Persistence.Repositories;

public class OrderReturnRepository(AppDbContext context) : BaseRepository<OrderReturn>(context), IOrderReturnRepository
{
    public async Task<OrderReturn?> GetByOrderIdAsync(Guid orderId)
        => await DbSet.FirstOrDefaultAsync(r => r.OrderId == orderId);

    public async Task<IEnumerable<OrderReturn>> GetBySellerIdAsync(Guid sellerId)
        => await DbSet
            .Include(r => r.Order).ThenInclude(o => o!.Items)
            .Where(r => r.Order!.Items.Any(i =>
                context.Products.Any(p => p.Id == i.ProductId && p.SellerId == sellerId)))
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

    public async Task<IEnumerable<OrderReturn>> GetByUserIdAsync(Guid userId)
        => await DbSet
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
}
