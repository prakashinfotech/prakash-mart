namespace PrakashMart.Application.DTOs.Admin;

public record AdminStatsDto(
    int TotalOrders,
    int TotalSellers,
    int TotalProducts,
    decimal TotalRevenue,
    int TotalCustomers,
    IEnumerable<AdminMonthlyRevenueDto> MonthlyRevenue,
    IEnumerable<AdminCategoryRevenueDto> TopCategories);

public record AdminMonthlyRevenueDto(string Month, decimal Revenue, int Orders);
public record AdminCategoryRevenueDto(string Category, decimal Revenue);
