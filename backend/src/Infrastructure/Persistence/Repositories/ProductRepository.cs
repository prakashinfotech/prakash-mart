using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace PrakashMart.Infrastructure.Persistence.Repositories;

public class ProductRepository(AppDbContext context) : BaseRepository<Product>(context), IProductRepository
{
    public override async Task<Product?> GetByIdAsync(Guid id)
        => await DbSet
            .Include(p => p.Seller)
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive && p.Seller!.IsActive);

    public async Task<Product?> GetBySlugAsync(string slug)
        => await DbSet
            .Include(p => p.Seller)
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Slug == slug && p.IsActive && p.Seller!.IsActive);

    public async Task<bool> SlugExistsAsync(string slug, Guid? excludeId = null)
        => await DbSet.AnyAsync(p => p.Slug == slug && (excludeId == null || p.Id != excludeId));

    public async Task<IEnumerable<Product>> GetFilteredAsync(
        string? category, Guid? brandId, decimal? minPrice, decimal? maxPrice, int? minRating,
        string? size = null, string? color = null)
    {
        var query = DbSet
            .Include(p => p.Seller)
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Include(p => p.Variants)
            .Where(p => p.IsActive && p.Seller!.IsActive);

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(p => p.Category!.Name == category);

        if (brandId.HasValue)
            query = query.Where(p => p.BrandId == brandId.Value);

        if (minPrice.HasValue)
            query = query.Where(p => p.Price >= minPrice.Value);

        if (maxPrice.HasValue)
            query = query.Where(p => p.Price <= maxPrice.Value);

        if (minRating.HasValue)
            query = query.Where(p => p.Rating >= minRating.Value);

        // Generic attribute filter: matches if any active variant's Attributes JSON contains the value
        if (!string.IsNullOrWhiteSpace(size))
            query = query.Where(p => p.Variants.Any(v => v.IsActive && v.Attributes.Contains(size)));

        if (!string.IsNullOrWhiteSpace(color))
            query = query.Where(p => p.Variants.Any(v => v.IsActive && v.Attributes.Contains(color)));

        return await query.ToListAsync();
    }

    public async Task<(IEnumerable<string> Sizes, IEnumerable<string> Colors)> GetVariantOptionsAsync()
    {
        // Legacy method — returns empty; callers should use GetByCategoryAsync on VariantTypeRepository
        return (Enumerable.Empty<string>(), Enumerable.Empty<string>());
    }

    public async Task<IEnumerable<(string Term, string Type)>> GetSuggestionsAsync(string q, int limit)
    {
        var productNames = await DbSet
            .Where(p => p.IsActive && p.Seller!.IsActive && p.Name.Contains(q))
            .Select(p => p.Name)
            .Distinct()
            .Take(limit)
            .ToListAsync();

        var brandNames = await DbSet
            .Where(p => p.IsActive && p.Seller!.IsActive && p.Brand != null && p.Brand.Name.Contains(q))
            .Select(p => p.Brand!.Name)
            .Distinct()
            .Take(limit)
            .ToListAsync();

        return productNames.Select(n => (n, "product"))
            .Concat(brandNames.Except(productNames).Select(n => (n, "brand")))
            .Take(limit);
    }
}
