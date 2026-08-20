using PrakashMart.Application.DTOs.Variants;

namespace PrakashMart.Application.Interfaces;

public interface IVariantTypeService
{
    Task<IEnumerable<VariantTypeDto>> GetAllAsync();
    Task<VariantTypeDto> GetByIdAsync(Guid id);
    Task<IEnumerable<CategoryVariantTypeDto>> GetByCategoryAsync(Guid categoryId);
    Task<VariantTypeDto> CreateAsync(CreateVariantTypeDto dto);
    Task<VariantTypeDto> UpdateAsync(Guid id, UpdateVariantTypeDto dto);
    Task ToggleActiveAsync(Guid id);
    Task DeleteAsync(Guid id);
}
