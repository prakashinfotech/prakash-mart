using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace PrakashMart.Infrastructure.Persistence.Repositories;

public class BannerRepository(AppDbContext context) : BaseRepository<Banner>(context), IBannerRepository
{
    public new async Task<IEnumerable<Banner>> GetAllAsync()
        => await DbSet.OrderBy(b => b.SortOrder).ToListAsync();

    public async Task<IEnumerable<Banner>> GetActiveAsync()
        => await DbSet.Where(b => b.IsActive).OrderBy(b => b.SortOrder).ToListAsync();
}
