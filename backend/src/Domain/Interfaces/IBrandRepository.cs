using PrakashMart.Domain.Entities;

namespace PrakashMart.Domain.Interfaces;

public interface IBrandRepository : IRepository<Brand>
{
    new Task<IEnumerable<Brand>> GetAllAsync();
    Task<IEnumerable<Brand>> GetByCategoryAsync(Guid categoryId);
    Task<Brand?> GetByNameAsync(string name);
}
