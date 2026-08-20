using PrakashMart.Application.DTOs.Returns;

namespace PrakashMart.Application.Interfaces;

public interface IOrderReturnService
{
    Task<OrderReturnDto> RequestReturnAsync(Guid orderId, Guid userId, CreateReturnRequestDto dto);
    Task<OrderReturnDto> ProcessReturnAsync(Guid returnId, Guid sellerId, ProcessReturnDto dto);
    Task<IEnumerable<OrderReturnDto>> GetSellerReturnsAsync(Guid sellerId);
    Task<OrderReturnDto?> GetByOrderIdAsync(Guid orderId, Guid userId);
}
