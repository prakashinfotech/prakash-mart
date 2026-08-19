using PrakashMart.Application.DTOs.Banners;

namespace PrakashMart.Application.Interfaces;

public interface IBannerService
{
    Task<IEnumerable<BannerDto>> GetAllAsync();
    Task<IEnumerable<BannerDto>> GetActiveAsync();
    Task<BannerDto> CreateAsync(CreateBannerDto dto);
    Task<BannerDto> UpdateAsync(Guid id, UpdateBannerDto dto);
    Task ToggleActiveAsync(Guid id);
    Task DeleteAsync(Guid id);
}
