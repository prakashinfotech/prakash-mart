using PrakashMart.Application.DTOs.Admin;
using PrakashMart.Application.DTOs.Products;

namespace PrakashMart.Application.Interfaces;

public interface IAdminService
{
    Task<AdminStatsDto> GetStatsAsync();
    Task<IEnumerable<SellerSummaryDto>> GetSellersAsync();
    Task<SellerSummaryDto> CreateSellerAsync(CreateSellerDto dto);
    Task<SellerSummaryDto> ToggleSellerActiveAsync(Guid sellerId);
    Task<IEnumerable<UserSummaryDto>> GetAllUsersAsync();
    Task<UserSummaryDto> ToggleUserActiveAsync(Guid userId);
    Task<ProductDto> ToggleProductActiveAsync(Guid productId);
}
