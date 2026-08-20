using PrakashMart.Application.DTOs.Seller;

namespace PrakashMart.Application.Interfaces;

public interface ISellerAnalyticsService
{
    Task<SellerAnalyticsDto> GetAnalyticsAsync(Guid sellerId);
    Task<IEnumerable<SellerOrderDto>> GetSellerOrdersAsync(Guid sellerId);
}
