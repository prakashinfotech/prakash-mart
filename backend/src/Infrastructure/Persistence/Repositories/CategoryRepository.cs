using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace PrakashMart.Infrastructure.Persistence.Repositories;

public class CategoryRepository(AppDbContext context) : BaseRepository<Category>(context), ICategoryRepository
{
    public new async Task<IEnumerable<Category>> GetAllAsync()
        => await DbSet.OrderBy(c => c.Name).ToListAsync();

    public async Task<Category?> GetByNameAsync(string name)
        => await DbSet.FirstOrDefaultAsync(c => c.Name == name);
}
