namespace PrakashMart.Application.DTOs.Brands;

public record BrandDto(Guid Id, string Name, string? Description, Guid? CategoryId, string? CategoryName);
public record CreateBrandDto(string Name, string? Description = null, Guid? CategoryId = null);
public record UpdateBrandDto(string Name, string? Description = null, Guid? CategoryId = null);
