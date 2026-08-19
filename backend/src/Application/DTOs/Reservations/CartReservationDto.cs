namespace PrakashMart.Application.DTOs.Reservations;

public record CartReservationItemDto(Guid VariantId, int Quantity);

public record ReserveCartDto(IEnumerable<CartReservationItemDto> Items);

public record ReservedItemSummaryDto(Guid VariantId, string VariantLabel, string SKU, int Quantity);

public record CartReservationStatusDto(
    bool IsActive,
    DateTime? ExpiresAt,
    int SecondsRemaining,
    IEnumerable<ReservedItemSummaryDto> Items);
