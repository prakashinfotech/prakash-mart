namespace PrakashMart.Application.DTOs.Banners;

public record BannerDto(
    Guid Id,
    string Title,
    string Subtitle,
    string Badge,
    string CtaText,
    string CtaCategory,
    string Gradient,
    string Emoji,
    int SortOrder,
    bool IsActive
);

public record CreateBannerDto(
    string Title,
    string Subtitle,
    string Badge,
    string CtaText,
    string CtaCategory,
    string Gradient,
    string Emoji,
    int SortOrder
);

public record UpdateBannerDto(
    string Title,
    string Subtitle,
    string Badge,
    string CtaText,
    string CtaCategory,
    string Gradient,
    string Emoji,
    int SortOrder
);
