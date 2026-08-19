using PrakashMart.Application.DTOs.Inventory;

namespace PrakashMart.Application.Interfaces;

public interface IInventoryForecastService
{
    Task<ForecastSummaryDto> GetSellerForecastAsync(Guid sellerId);
    Task<ForecastSummaryDto> GetAdminForecastAsync();
}
