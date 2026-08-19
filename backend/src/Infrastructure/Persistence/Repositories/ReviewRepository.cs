using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace PrakashMart.Infrastructure.Persistence.Repositories;

public class ReviewRepository(AppDbContext context) : BaseRepository<Review>(context), IReviewRepository
{
    public async Task<IEnumerable<Review>> GetByProductIdAsync(Guid productId)
        => await DbSet
            .Include(r => r.User)
            .Where(r => r.ProductId == productId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

    public async Task<bool> HasUserReviewedAsync(Guid productId, Guid userId)
        => await DbSet.AnyAsync(r => r.ProductId == productId && r.UserId == userId);
}
