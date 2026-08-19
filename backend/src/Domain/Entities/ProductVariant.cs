namespace PrakashMart.Domain.Entities;

public class ProductVariant : BaseEntity
{
    public Guid ProductId { get; private set; }
    public string Attributes { get; private set; } = "{}"; // JSON: {"Size":"M","Color":"Red"}
    public int Stock { get; private set; }
    public int ReservedQuantity { get; private set; }
    public decimal? PriceOverride { get; private set; }
    public bool IsActive { get; private set; } = true;
    public string SKU { get; private set; } = string.Empty;
    public string? Barcode { get; private set; }

    // Managed by SQL Server — used by EF Core for optimistic concurrency on non-inventory updates (e.g. price, attributes)
    public byte[] RowVersion { get; private set; } = [];

    public Product? Product { get; private set; }

    // Available stock = total stock minus what is currently held by active reservations
    public int AvailableStock => Math.Max(0, Stock - ReservedQuantity);

    public bool CanFulfill(int qty) => AvailableStock >= qty;

    private ProductVariant() { }

    public static ProductVariant Create(Guid productId, string attributes, int stock, decimal? priceOverride, string? sku = null)
    {
        var variant = new ProductVariant
        {
            ProductId = productId,
            Attributes = attributes,
            Stock = stock,
            PriceOverride = priceOverride,
        };
        // Use provided SKU, or generate a deterministic one from the variant's own Id
        variant.SKU = string.IsNullOrWhiteSpace(sku)
            ? $"VAR-{variant.Id.ToString("N")[..8].ToUpperInvariant()}"
            : sku.Trim().ToUpperInvariant();
        return variant;
    }

    public void Update(string attributes, int stock, decimal? priceOverride, string? barcode = null)
    {
        Attributes = attributes;
        Stock = stock;
        PriceOverride = priceOverride;
        Barcode = barcode;
        SetUpdated();
    }

    public void SetActive(bool active) { IsActive = active; SetUpdated(); }

    public void SetStock(int newStock) { Stock = newStock; SetUpdated(); }

    // Builds label from all attribute key-value pairs e.g. "128GB / 8GB / Black"
    public string Label
    {
        get
        {
            try
            {
                var dict = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(Attributes);
                return dict is null ? string.Empty : string.Join(" / ", dict.Values.Where(v => !string.IsNullOrWhiteSpace(v)));
            }
            catch { return string.Empty; }
        }
    }
}
