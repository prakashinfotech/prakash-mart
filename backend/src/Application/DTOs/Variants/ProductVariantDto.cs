namespace PrakashMart.Application.DTOs.Variants;

public record ProductVariantDto(
    Guid Id,
    Guid ProductId,
    string SKU,
    string? Barcode,
    Dictionary<string, string> Attributes,
    int Stock,
    int ReservedQuantity,
    int AvailableStock,
    decimal? PriceOverride,
    bool IsActive,
    string Label);

public record CreateVariantDto(
    Dictionary<string, string> Attributes,
    int Stock,
    decimal? PriceOverride,
    string? SKU = null,
    string? Barcode = null);

public record UpdateVariantDto(
    Dictionary<string, string> Attributes,
    int Stock,
    decimal? PriceOverride,
    string? Barcode = null);
