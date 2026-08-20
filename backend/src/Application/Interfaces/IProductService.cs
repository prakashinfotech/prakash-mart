using PrakashMart.Application.DTOs.Products;

namespace PrakashMart.Application.Interfaces;

public interface IProductService
{
    Task<IEnumerable<ProductDto>> GetFilteredAsync(ProductFilterDto filter);
    Task<VariantOptionsDto> GetVariantOptionsAsync();
    Task<IEnumerable<SuggestionDto>> GetSuggestionsAsync(string q, int limit = 8);
    Task<ProductDto> GetByIdAsync(Guid id);
    Task<ProductDto> GetBySlugAsync(string slug);
    Task<ProductDto> CreateAsync(CreateProductDto dto, Guid sellerId);
    Task<ProductDto> UpdateAsync(Guid id, UpdateProductDto dto, Guid sellerId);
    Task DeleteAsync(Guid id, Guid sellerId);
}
