using System.Text.Json;
using PrakashMart.Application.Common.Exceptions;
using PrakashMart.Application.DTOs.Variants;
using PrakashMart.Application.Interfaces;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;

namespace PrakashMart.Application.Services;

public class VariantTypeService(
    IVariantTypeRepository variantTypeRepository,
    IUnitOfWork unitOfWork) : IVariantTypeService
{
    private static readonly JsonSerializerOptions _jsonOpts = new() { PropertyNameCaseInsensitive = true };

    private static List<string> ParseOptions(string json)
    {
        try { return JsonSerializer.Deserialize<List<string>>(json, _jsonOpts) ?? []; }
        catch { return []; }
    }

    private static VariantTypeDto ToDto(VariantType vt) => new(
        vt.Id,
        vt.Name,
        vt.DisplayType,
        ParseOptions(vt.SuggestedOptions),
        vt.IsActive,
        vt.CategoryVariantTypes.Select(cvt => cvt.CategoryId).ToList());

    private static CategoryVariantTypeDto ToCategoryDto(CategoryVariantType cvt) => new(
        cvt.VariantTypeId,
        cvt.VariantType!.Name,
        cvt.VariantType!.DisplayType,
        ParseOptions(cvt.VariantType!.SuggestedOptions),
        cvt.DisplayOrder,
        cvt.IsRequired);

    public async Task<IEnumerable<VariantTypeDto>> GetAllAsync()
        => (await variantTypeRepository.GetAllAsync()).Select(ToDto);

    public async Task<VariantTypeDto> GetByIdAsync(Guid id)
    {
        var vt = await variantTypeRepository.GetByIdAsync(id)
            ?? throw new NotFoundException("Variant type not found.");
        return ToDto(vt);
    }

    public async Task<IEnumerable<CategoryVariantTypeDto>> GetByCategoryAsync(Guid categoryId)
        => (await variantTypeRepository.GetMappingsByCategoryAsync(categoryId))
            .OrderBy(cvt => cvt.DisplayOrder)
            .Select(ToCategoryDto);

    public async Task<VariantTypeDto> CreateAsync(CreateVariantTypeDto dto)
    {
        var optionsJson = JsonSerializer.Serialize(dto.SuggestedOptions);
        var vt = VariantType.Create(dto.Name, dto.DisplayType, optionsJson);
        await variantTypeRepository.AddAsync(vt);
        await unitOfWork.SaveChangesAsync();

        // Create category mappings
        for (var i = 0; i < dto.CategoryIds.Count; i++)
        {
            var mapping = CategoryVariantType.Create(dto.CategoryIds[i], vt.Id, i, false);
            await variantTypeRepository.AddCategoryMappingAsync(mapping);
        }
        await unitOfWork.SaveChangesAsync();

        var created = await variantTypeRepository.GetByIdAsync(vt.Id)
            ?? throw new NotFoundException("Variant type not found after create.");
        return ToDto(created);
    }

    public async Task<VariantTypeDto> UpdateAsync(Guid id, UpdateVariantTypeDto dto)
    {
        var vt = await variantTypeRepository.GetByIdAsync(id)
            ?? throw new NotFoundException("Variant type not found.");

        var optionsJson = JsonSerializer.Serialize(dto.SuggestedOptions);
        vt.Update(dto.Name, dto.DisplayType, optionsJson);
        variantTypeRepository.Update(vt);

        // Sync category mappings: remove old, add new
        var existingMappings = await variantTypeRepository.GetMappingsByCategoryAsync(Guid.Empty);
        var currentMappings = vt.CategoryVariantTypes.ToList();
        foreach (var m in currentMappings)
            variantTypeRepository.RemoveCategoryMapping(m);

        await unitOfWork.SaveChangesAsync();

        for (var i = 0; i < dto.CategoryIds.Count; i++)
        {
            var mapping = CategoryVariantType.Create(dto.CategoryIds[i], id, i, false);
            await variantTypeRepository.AddCategoryMappingAsync(mapping);
        }
        await unitOfWork.SaveChangesAsync();

        var updated = await variantTypeRepository.GetByIdAsync(id)
            ?? throw new NotFoundException("Variant type not found after update.");
        return ToDto(updated);
    }

    public async Task ToggleActiveAsync(Guid id)
    {
        var vt = await variantTypeRepository.GetByIdAsync(id)
            ?? throw new NotFoundException("Variant type not found.");
        vt.SetActive(!vt.IsActive);
        variantTypeRepository.Update(vt);
        await unitOfWork.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var vt = await variantTypeRepository.GetByIdAsync(id)
            ?? throw new NotFoundException("Variant type not found.");
        variantTypeRepository.Delete(vt);
        await unitOfWork.SaveChangesAsync();
    }
}
