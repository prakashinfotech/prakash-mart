using PrakashMart.Application.DTOs.Orders;

namespace PrakashMart.Application.Interfaces;

public interface IOrderService
{
    Task<IEnumerable<OrderDto>> GetUserOrdersAsync(Guid userId);
    Task<IEnumerable<OrderDto>> GetAllOrdersAsync();
    Task<OrderDto> GetByIdAsync(Guid orderId, Guid userId);
    Task<OrderDto> CreateAsync(Guid userId, CreateOrderDto dto);
    Task<OrderDto> UpdateStatusAsync(Guid orderId, string status, Guid requesterId);
    Task<OrderDto> CancelOrderAsync(Guid orderId, Guid userId);
}
