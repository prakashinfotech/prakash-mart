namespace PrakashMart.Application.DTOs.Products;

public record CreateProductDto(
    string Name,
    string Description,
    decimal Price,
    decimal? DiscountPercent,
    Guid CategoryId,
    Guid BrandId,
    string ImageUrl,
    int Stock,
    List<string>? ImageUrls = null,
    string? Warranty = null,
    string? CountryOfOrigin = null,
    string? DispatchInfo = null,
    string? ShipsFrom = null,
    List<string>? Offers = null);
