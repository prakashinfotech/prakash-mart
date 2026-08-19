using PrakashMart.Domain.Entities;

namespace PrakashMart.Domain.Interfaces;

public interface ICartRepository : IRepository<Cart>
{
    Task<Cart?> GetByUserIdWithItemsAsync(Guid userId);
}
