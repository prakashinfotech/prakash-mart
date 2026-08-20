using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace PrakashMart.Infrastructure.Persistence.Repositories;

public class VariantTypeRepository(AppDbContext context) : IVariantTypeRepository
{
    public async Task<IEnumerable<VariantType>> GetAllAsync()
        => await context.VariantTypes
            .Include(vt => vt.CategoryVariantTypes)
            .OrderBy(vt => vt.Name)
            .ToListAsync();

    public async Task<VariantType?> GetByIdAsync(Guid id)
        => await context.VariantTypes
            .Include(vt => vt.CategoryVariantTypes)
            .FirstOrDefaultAsync(vt => vt.Id == id);

    public async Task<IEnumerable<VariantType>> GetByCategoryAsync(Guid categoryId)
        => await context.VariantTypes
            .Include(vt => vt.CategoryVariantTypes)
            .Where(vt => vt.IsActive && vt.CategoryVariantTypes.Any(cvt => cvt.CategoryId == categoryId))
            .ToListAsync();

    public async Task AddAsync(VariantType variantType) => await context.VariantTypes.AddAsync(variantType);
    public void Update(VariantType variantType) => context.VariantTypes.Update(variantType);
    public void Delete(VariantType variantType) => context.VariantTypes.Remove(variantType);

    public async Task AddCategoryMappingAsync(CategoryVariantType mapping)
        => await context.CategoryVariantTypes.AddAsync(mapping);

    public void RemoveCategoryMapping(CategoryVariantType mapping)
        => context.CategoryVariantTypes.Remove(mapping);

    public async Task<CategoryVariantType?> GetMappingAsync(Guid categoryId, Guid variantTypeId)
        => await context.CategoryVariantTypes
            .FirstOrDefaultAsync(m => m.CategoryId == categoryId && m.VariantTypeId == variantTypeId);

    public async Task<IEnumerable<CategoryVariantType>> GetMappingsByCategoryAsync(Guid categoryId)
        => await context.CategoryVariantTypes
            .Include(cvt => cvt.VariantType)
            .Where(cvt => cvt.CategoryId == categoryId && cvt.VariantType!.IsActive)
            .OrderBy(cvt => cvt.DisplayOrder)
            .ToListAsync();
}
