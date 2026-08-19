using PrakashMart.Domain.Entities;

namespace PrakashMart.Domain.Interfaces;

public interface IOrderRepository : IRepository<Order>
{
    Task<IEnumerable<Order>> GetByUserIdAsync(Guid userId);
    new Task<IEnumerable<Order>> GetAllAsync();
    Task<Order?> GetByIdWithItemsAsync(Guid orderId);
    Task<bool> HasUserPurchasedProductAsync(Guid userId, Guid productId);
    Task<IEnumerable<Order>> GetBySellerIdAsync(Guid sellerId);
}
