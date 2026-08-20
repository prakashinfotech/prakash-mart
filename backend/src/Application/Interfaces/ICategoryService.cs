using PrakashMart.Application.DTOs.Categories;

namespace PrakashMart.Application.Interfaces;

public interface ICategoryService
{
    Task<IEnumerable<CategoryDto>> GetAllAsync();
    Task<CategoryDto> CreateAsync(CreateCategoryDto dto);
    Task DeleteAsync(Guid id);
}
