namespace PrakashMart.Application.DTOs.Products;

public record VariantOptionsDto(IEnumerable<string> Sizes, IEnumerable<string> Colors);
