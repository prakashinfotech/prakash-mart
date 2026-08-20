using PrakashMart.Application.DTOs.Brands;

namespace PrakashMart.Application.Interfaces;

public interface IBrandService
{
    Task<IEnumerable<BrandDto>> GetAllAsync();
    Task<IEnumerable<BrandDto>> GetByCategoryAsync(Guid categoryId);
    Task<BrandDto> CreateAsync(CreateBrandDto dto);
    Task<BrandDto> UpdateAsync(Guid id, UpdateBrandDto dto);
    Task DeleteAsync(Guid id);
}
