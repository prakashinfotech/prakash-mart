using PrakashMart.Domain.Entities;

namespace PrakashMart.Domain.Interfaces;

public interface IVariantTypeRepository
{
    Task<IEnumerable<VariantType>> GetAllAsync();
    Task<VariantType?> GetByIdAsync(Guid id);
    Task<IEnumerable<VariantType>> GetByCategoryAsync(Guid categoryId);
    Task AddAsync(VariantType variantType);
    void Update(VariantType variantType);
    void Delete(VariantType variantType);
    Task AddCategoryMappingAsync(CategoryVariantType mapping);
    void RemoveCategoryMapping(CategoryVariantType mapping);
    Task<CategoryVariantType?> GetMappingAsync(Guid categoryId, Guid variantTypeId);
    Task<IEnumerable<CategoryVariantType>> GetMappingsByCategoryAsync(Guid categoryId);
}
