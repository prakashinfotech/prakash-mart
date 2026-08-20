using PrakashMart.Domain.Entities;

namespace PrakashMart.Domain.Interfaces;

public interface IProductRepository : IRepository<Product>
{
    Task<Product?> GetBySlugAsync(string slug);
    Task<bool> SlugExistsAsync(string slug, Guid? excludeId = null);
    Task<IEnumerable<Product>> GetFilteredAsync(string? category, Guid? brandId, decimal? minPrice, decimal? maxPrice, int? minRating, string? size = null, string? color = null);
    Task<(IEnumerable<string> Sizes, IEnumerable<string> Colors)> GetVariantOptionsAsync();
    Task<IEnumerable<(string Term, string Type)>> GetSuggestionsAsync(string q, int limit);
}
