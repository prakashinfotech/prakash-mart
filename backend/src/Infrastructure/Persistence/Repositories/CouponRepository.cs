using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace PrakashMart.Infrastructure.Persistence.Repositories;

public class CouponRepository(AppDbContext context) : BaseRepository<Coupon>(context), ICouponRepository
{
    public new async Task<IEnumerable<Coupon>> GetAllAsync()
        => await DbSet.OrderByDescending(c => c.CreatedAt).ToListAsync();

    public async Task<Coupon?> GetByCodeAsync(string code)
        => await DbSet.FirstOrDefaultAsync(c => c.Code == code);
}
