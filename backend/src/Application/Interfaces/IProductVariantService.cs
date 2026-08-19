using PrakashMart.Application.DTOs.Variants;

namespace PrakashMart.Application.Interfaces;

public interface IProductVariantService
{
    Task<IEnumerable<ProductVariantDto>> GetByProductAsync(Guid productId);
    Task<ProductVariantDto> CreateAsync(Guid productId, CreateVariantDto dto, Guid sellerId);
    Task<ProductVariantDto> UpdateAsync(Guid variantId, UpdateVariantDto dto, Guid sellerId);
    Task ToggleActiveAsync(Guid variantId, Guid sellerId);
    Task DeleteAsync(Guid variantId, Guid sellerId);
}
