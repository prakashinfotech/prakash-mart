using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace PrakashMart.Infrastructure.Persistence.Repositories;

public class BrandRepository(AppDbContext context) : BaseRepository<Brand>(context), IBrandRepository
{
    public new async Task<IEnumerable<Brand>> GetAllAsync()
        => await DbSet.Include(b => b.Category).OrderBy(b => b.Name).ToListAsync();

    public async Task<IEnumerable<Brand>> GetByCategoryAsync(Guid categoryId)
        => await DbSet.Include(b => b.Category).Where(b => b.CategoryId == categoryId).OrderBy(b => b.Name).ToListAsync();

    public async Task<Brand?> GetByNameAsync(string name)
        => await DbSet.FirstOrDefaultAsync(b => b.Name == name);
}
