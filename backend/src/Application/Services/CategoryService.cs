using PrakashMart.Application.Common.Exceptions;
using PrakashMart.Application.DTOs.Categories;
using PrakashMart.Application.Interfaces;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;

namespace PrakashMart.Application.Services;

public class CategoryService(ICategoryRepository categoryRepository, IUnitOfWork unitOfWork) : ICategoryService
{
    public async Task<IEnumerable<CategoryDto>> GetAllAsync()
    {
        var categories = await categoryRepository.GetAllAsync();
        return categories.Select(c => new CategoryDto(c.Id, c.Name));
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryDto dto)
    {
        if (await categoryRepository.GetByNameAsync(dto.Name) is not null)
            throw new AppException($"Category '{dto.Name}' already exists.");

        var category = Category.Create(dto.Name);
        await categoryRepository.AddAsync(category);
        await unitOfWork.SaveChangesAsync();
        return new CategoryDto(category.Id, category.Name);
    }

    public async Task DeleteAsync(Guid id)
    {
        var category = await categoryRepository.GetByIdAsync(id)
            ?? throw new NotFoundException("Category not found.");
        categoryRepository.Delete(category);
        await unitOfWork.SaveChangesAsync();
    }
}
