using PrakashMart.Application.Common.Exceptions;
using PrakashMart.Application.DTOs.Brands;
using PrakashMart.Application.Interfaces;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;

namespace PrakashMart.Application.Services;

public class BrandService(IBrandRepository brandRepository, IUnitOfWork unitOfWork) : IBrandService
{
    public async Task<IEnumerable<BrandDto>> GetAllAsync()
    {
        var brands = await brandRepository.GetAllAsync();
        return brands.Select(Map);
    }

    public async Task<IEnumerable<BrandDto>> GetByCategoryAsync(Guid categoryId)
    {
        var brands = await brandRepository.GetByCategoryAsync(categoryId);
        return brands.Select(Map);
    }

    public async Task<BrandDto> CreateAsync(CreateBrandDto dto)
    {
        if (await brandRepository.GetByNameAsync(dto.Name) is not null)
            throw new AppException($"Brand '{dto.Name}' already exists.");

        var brand = Brand.Create(dto.Name, dto.CategoryId, dto.Description);
        await brandRepository.AddAsync(brand);
        await unitOfWork.SaveChangesAsync();
        return Map(brand);
    }

    public async Task<BrandDto> UpdateAsync(Guid id, UpdateBrandDto dto)
    {
        var brand = await brandRepository.GetByIdAsync(id)
            ?? throw new NotFoundException("Brand not found.");

        if (brand.Name != dto.Name && await brandRepository.GetByNameAsync(dto.Name) is not null)
            throw new AppException($"Brand '{dto.Name}' already exists.");

        brand.Update(dto.Name, dto.CategoryId, dto.Description);
        brandRepository.Update(brand);
        await unitOfWork.SaveChangesAsync();
        return Map(brand);
    }

    public async Task DeleteAsync(Guid id)
    {
        var brand = await brandRepository.GetByIdAsync(id)
            ?? throw new NotFoundException("Brand not found.");
        brandRepository.Delete(brand);
        await unitOfWork.SaveChangesAsync();
    }

    private static BrandDto Map(Brand b) =>
        new(b.Id, b.Name, b.Description, b.CategoryId, b.Category?.Name);
}
