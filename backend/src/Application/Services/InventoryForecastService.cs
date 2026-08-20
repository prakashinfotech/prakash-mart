using PrakashMart.Application.DTOs.Inventory;
using PrakashMart.Application.Interfaces;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;

namespace PrakashMart.Application.Services;

public class InventoryForecastService(
    IInventoryTransactionRepository txRepository,
    IProductVariantRepository variantRepository) : IInventoryForecastService
{
    public async Task<ForecastSummaryDto> GetSellerForecastAsync(Guid sellerId)
    {
        var variants = await variantRepository.GetActiveBySellerIdAsync(sellerId);
        var purchases = await txRepository.GetPurchasesBySellerAsync(sellerId, DateTime.UtcNow.AddDays(-30));
        return BuildSummary(variants, purchases);
    }

    public async Task<ForecastSummaryDto> GetAdminForecastAsync()
    {
        var variants = await variantRepository.GetAllActiveAsync();
        var purchases = await txRepository.GetPurchasesAllAsync(DateTime.UtcNow.AddDays(-30));
        return BuildSummary(variants, purchases);
    }

    private static ForecastSummaryDto BuildSummary(
        IEnumerable<ProductVariant> variants,
        IEnumerable<Domain.Entities.InventoryTransaction> purchases)
    {
        var now = DateTime.UtcNow;
        var cutoff7d = now.AddDays(-7);

        var purchaseList = purchases.ToList();

        var sales30d = purchaseList
            .GroupBy(t => t.ProductVariantId)
            .ToDictionary(g => g.Key, g => g.Sum(t => Math.Abs(t.QuantityChanged)));

        var sales7d = purchaseList
            .Where(t => t.CreatedAt >= cutoff7d)
            .GroupBy(t => t.ProductVariantId)
            .ToDictionary(g => g.Key, g => g.Sum(t => Math.Abs(t.QuantityChanged)));

        var items = variants.Select(v =>
        {
            var sold30 = sales30d.GetValueOrDefault(v.Id, 0);
            var sold7 = sales7d.GetValueOrDefault(v.Id, 0);
            var vel30 = Math.Round(sold30 / 30.0, 2);
            var vel7 = Math.Round(sold7 / 7.0, 2);
            var velUsed = Math.Max(vel7, vel30);

            double daysRemaining;
            string status;

            if (v.AvailableStock == 0)
            {
                daysRemaining = 0;
                status = "OutOfStock";
            }
            else if (velUsed == 0)
            {
                daysRemaining = -1;
                status = "NoSales";
            }
            else
            {
                daysRemaining = Math.Round(v.AvailableStock / velUsed, 1);
                status = daysRemaining < 7 ? "Critical" : daysRemaining < 14 ? "Low" : "Healthy";
            }

            return new VariantForecastDto(
                v.Id, v.ProductId,
                v.Product?.Name ?? string.Empty,
                v.Label, v.SKU,
                v.AvailableStock, v.ReservedQuantity,
                vel7, vel30, daysRemaining, status);
        })
        .OrderBy(x => x.DaysRemaining < 0 ? double.MaxValue : x.DaysRemaining)
        .ToList();

        return new ForecastSummaryDto(
            TotalVariants: items.Count,
            OutOfStockCount: items.Count(x => x.Status == "OutOfStock"),
            CriticalCount: items.Count(x => x.Status == "Critical"),
            LowCount: items.Count(x => x.Status == "Low"),
            HealthyCount: items.Count(x => x.Status == "Healthy"),
            NoSalesCount: items.Count(x => x.Status == "NoSales"),
            Items: items);
    }
}
