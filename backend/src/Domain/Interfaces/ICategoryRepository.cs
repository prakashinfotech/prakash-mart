using PrakashMart.Domain.Entities;

namespace PrakashMart.Domain.Interfaces;

public interface ICategoryRepository : IRepository<Category>
{
    new Task<IEnumerable<Category>> GetAllAsync();
    Task<Category?> GetByNameAsync(string name);
}
