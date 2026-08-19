using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace PrakashMart.Infrastructure.Persistence.Repositories;

public class OrderRepository(AppDbContext context) : BaseRepository<Order>(context), IOrderRepository
{
    public async Task<IEnumerable<Order>> GetByUserIdAsync(Guid userId)
        => await DbSet
            .Include(o => o.Items)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

    public new async Task<IEnumerable<Order>> GetAllAsync()
        => await DbSet
            .Include(o => o.Items)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

    public async Task<Order?> GetByIdWithItemsAsync(Guid orderId)
        => await DbSet
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId);

    public async Task<bool> HasUserPurchasedProductAsync(Guid userId, Guid productId)
        => await DbSet
            .AnyAsync(o => o.UserId == userId
                && o.Status == Domain.Enums.OrderStatus.Delivered
                && o.Items.Any(i => i.ProductId == productId));

    public async Task<IEnumerable<Order>> GetBySellerIdAsync(Guid sellerId)
        => await DbSet
            .Include(o => o.Items)
            .Where(o => o.Items.Any(i =>
                context.Products.Any(p => p.Id == i.ProductId && p.SellerId == sellerId)))
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
}
