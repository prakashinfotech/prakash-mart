using PrakashMart.Domain.Entities;

namespace PrakashMart.Domain.Interfaces;

public interface IOrderReturnRepository : IRepository<OrderReturn>
{
    Task<OrderReturn?> GetByOrderIdAsync(Guid orderId);
    Task<IEnumerable<OrderReturn>> GetBySellerIdAsync(Guid sellerId);
    Task<IEnumerable<OrderReturn>> GetByUserIdAsync(Guid userId);
}
