namespace PrakashMart.Application.DTOs.Inventory;

public record VariantForecastDto(
    Guid VariantId,
    Guid ProductId,
    string ProductName,
    string VariantLabel,
    string SKU,
    int AvailableStock,
    int ReservedQuantity,
    double Velocity7d,      // units sold per day, last 7 days
    double Velocity30d,     // units sold per day, last 30 days
    double DaysRemaining,   // -1 = no sales (treat as infinite); 0 = out of stock
    string Status);         // OutOfStock | Critical | Low | Healthy | NoSales

public record ForecastSummaryDto(
    int TotalVariants,
    int OutOfStockCount,
    int CriticalCount,
    int LowCount,
    int HealthyCount,
    int NoSalesCount,
    IEnumerable<VariantForecastDto> Items);
