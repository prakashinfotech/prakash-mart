using PrakashMart.Application.DTOs.Seller;
using PrakashMart.Application.Interfaces;
using PrakashMart.Domain.Interfaces;
using PrakashMart.Domain.Entities;

namespace PrakashMart.Application.Services;

public class SellerAnalyticsService(
    IOrderRepository orderRepository,
    IProductRepository productRepository) : ISellerAnalyticsService
{
    public async Task<SellerAnalyticsDto> GetAnalyticsAsync(Guid sellerId)
    {
        var products = await productRepository.GetFilteredAsync(null, null, null, null, null);
        var sellerProductIds = products
            .Where(p => p.SellerId == sellerId)
            .Select(p => p.Id)
            .ToHashSet();

        var allOrders = await orderRepository.GetAllAsync();

        var relevantItems = allOrders
            .SelectMany(o => o.Items.Select(i => (item: i, order: o)))
            .Where(x => sellerProductIds.Contains(x.item.ProductId))
            .ToList();

        var totalRevenue = relevantItems.Sum(x => x.item.UnitPrice * x.item.Quantity);
        var totalOrders = relevantItems.Select(x => x.order.Id).Distinct().Count();
        var totalProductsSold = relevantItems.Sum(x => x.item.Quantity);

        var sixMonthsAgo = DateTime.UtcNow.AddMonths(-5);
        var monthly = relevantItems
            .Where(x => x.order.CreatedAt >= sixMonthsAgo)
            .GroupBy(x => new { x.order.CreatedAt.Year, x.order.CreatedAt.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .Select(g => new MonthlyRevenueDto(
                new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM yyyy"),
                g.Sum(x => x.item.UnitPrice * x.item.Quantity)))
            .ToList();

        var topProducts = relevantItems
            .GroupBy(x => x.item.ProductName)
            .Select(g => new TopProductDto(g.Key, g.Sum(x => x.item.Quantity), g.Sum(x => x.item.UnitPrice * x.item.Quantity)))
            .OrderByDescending(p => p.Revenue)
            .Take(5)
            .ToList();

        return new SellerAnalyticsDto(totalRevenue, totalOrders, totalProductsSold, monthly, topProducts);
    }

    public async Task<IEnumerable<SellerOrderDto>> GetSellerOrdersAsync(Guid sellerId)
    {
        var products = await productRepository.GetFilteredAsync(null, null, null, null, null);
        var sellerProductIds = products
            .Where(p => p.SellerId == sellerId)
            .Select(p => p.Id)
            .ToHashSet();

        var orders = await orderRepository.GetBySellerIdAsync(sellerId);

        return orders.Select(o =>
        {
            var sellerItems = o.Items
                .Where(i => sellerProductIds.Contains(i.ProductId))
                .Select(i => new SellerOrderItemDto(
                    i.ProductId, i.ProductName, i.VariantLabel,
                    i.UnitPrice, i.Quantity, i.UnitPrice * i.Quantity))
                .ToList();

            return new SellerOrderDto(
                o.Id,
                o.Status.ToString(),
                o.CreatedAt,
                string.Empty,
                sellerItems,
                sellerItems.Sum(i => i.Subtotal));
        }).ToList();
    }
}
