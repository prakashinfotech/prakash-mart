namespace PrakashMart.Application.DTOs.Variants;

public record VariantTypeDto(
    Guid Id,
    string Name,
    string DisplayType,
    List<string> SuggestedOptions,
    bool IsActive,
    List<Guid> CategoryIds);

public record CreateVariantTypeDto(
    string Name,
    string DisplayType,
    List<string> SuggestedOptions,
    List<Guid> CategoryIds);

public record UpdateVariantTypeDto(
    string Name,
    string DisplayType,
    List<string> SuggestedOptions,
    List<Guid> CategoryIds);

public record CategoryVariantTypeDto(
    Guid VariantTypeId,
    string Name,
    string DisplayType,
    List<string> SuggestedOptions,
    int DisplayOrder,
    bool IsRequired);
