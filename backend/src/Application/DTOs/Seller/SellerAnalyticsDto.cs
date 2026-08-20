namespace PrakashMart.Application.DTOs.Seller;

public record SellerAnalyticsDto(
    decimal TotalRevenue,
    int TotalOrders,
    int TotalProductsSold,
    IEnumerable<MonthlyRevenueDto> MonthlyRevenue,
    IEnumerable<TopProductDto> TopProducts);

public record MonthlyRevenueDto(string Month, decimal Revenue);
public record TopProductDto(string ProductName, int UnitsSold, decimal Revenue);
