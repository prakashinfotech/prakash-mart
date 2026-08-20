using PrakashMart.Application.Common.Exceptions;
using PrakashMart.Application.DTOs.Banners;
using PrakashMart.Application.Interfaces;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;

namespace PrakashMart.Application.Services;

public class BannerService(IBannerRepository bannerRepository, IUnitOfWork unitOfWork) : IBannerService
{
    private static BannerDto ToDto(Banner b) => new(
        b.Id, b.Title, b.Subtitle, b.Badge, b.CtaText,
        b.CtaCategory, b.Gradient, b.Emoji, b.SortOrder, b.IsActive);

    public async Task<IEnumerable<BannerDto>> GetAllAsync()
        => (await bannerRepository.GetAllAsync()).Select(ToDto);

    public async Task<IEnumerable<BannerDto>> GetActiveAsync()
        => (await bannerRepository.GetActiveAsync()).Select(ToDto);

    public async Task<BannerDto> CreateAsync(CreateBannerDto dto)
    {
        var banner = Banner.Create(dto.Title, dto.Subtitle, dto.Badge, dto.CtaText,
            dto.CtaCategory, dto.Gradient, dto.Emoji, dto.SortOrder);
        await bannerRepository.AddAsync(banner);
        await unitOfWork.SaveChangesAsync();
        return ToDto(banner);
    }

    public async Task<BannerDto> UpdateAsync(Guid id, UpdateBannerDto dto)
    {
        var banner = await bannerRepository.GetByIdAsync(id)
            ?? throw new NotFoundException("Banner not found.");
        banner.Update(dto.Title, dto.Subtitle, dto.Badge, dto.CtaText,
            dto.CtaCategory, dto.Gradient, dto.Emoji, dto.SortOrder);
        await unitOfWork.SaveChangesAsync();
        return ToDto(banner);
    }

    public async Task ToggleActiveAsync(Guid id)
    {
        var banner = await bannerRepository.GetByIdAsync(id)
            ?? throw new NotFoundException("Banner not found.");
        banner.SetActive(!banner.IsActive);
        await unitOfWork.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var banner = await bannerRepository.GetByIdAsync(id)
            ?? throw new NotFoundException("Banner not found.");
        bannerRepository.Delete(banner);
        await unitOfWork.SaveChangesAsync();
    }
}
