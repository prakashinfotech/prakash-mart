namespace PrakashMart.Application.DTOs.Products;

public record ProductFilterDto(
    string? Category,
    Guid? BrandId,
    decimal? MinPrice,
    decimal? MaxPrice,
    int? MinRating,
    string? Size = null,
    string? Color = null);
