using PrakashMart.Domain.Entities;

namespace PrakashMart.Domain.Interfaces;

public interface IBannerRepository : IRepository<Banner>
{
    new Task<IEnumerable<Banner>> GetAllAsync();
    Task<IEnumerable<Banner>> GetActiveAsync();
}
