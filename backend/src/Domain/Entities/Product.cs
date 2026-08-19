namespace PrakashMart.Domain.Entities;

public class Product : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public decimal Price { get; private set; }
    public decimal? DiscountPercent { get; private set; }
    public Guid CategoryId { get; private set; }
    public Category? Category { get; private set; }
    public Guid BrandId { get; private set; }
    public Brand? Brand { get; private set; }
    public string ImageUrl { get; private set; } = string.Empty;
    public List<string> ImageUrls { get; private set; } = [];
    public int Stock { get; private set; }
    public bool IsActive { get; private set; } = true;
    public decimal Rating { get; private set; }
    public int ReviewCount { get; private set; }
    public Guid SellerId { get; private set; }
    public User? Seller { get; private set; }
    public string? Warranty { get; private set; }
    public string? CountryOfOrigin { get; private set; }
    public string? DispatchInfo { get; private set; }
    public string? ShipsFrom { get; private set; }
    public List<string> Offers { get; private set; } = [];
    public string Slug { get; private set; } = string.Empty;
    public ICollection<Review> Reviews { get; private set; } = [];
    public ICollection<ProductVariant> Variants { get; private set; } = [];

    private Product() { }

    public static Product Create(string name, string description, decimal price, decimal? discountPercent,
        Guid categoryId, Guid brandId, string imageUrl, int stock, Guid sellerId,
        List<string>? imageUrls = null, string? warranty = null, string? countryOfOrigin = null,
        string? dispatchInfo = null, string? shipsFrom = null, List<string>? offers = null)
        => new()
        {
            Name = name, Description = description, Price = price, DiscountPercent = discountPercent,
            CategoryId = categoryId, BrandId = brandId, ImageUrl = imageUrl, Stock = stock, SellerId = sellerId,
            ImageUrls = imageUrls ?? [],
            Warranty = warranty, CountryOfOrigin = countryOfOrigin,
            DispatchInfo = dispatchInfo, ShipsFrom = shipsFrom,
            Offers = offers ?? [],
        };

    public void Update(string name, string description, decimal price, decimal? discountPercent,
        Guid categoryId, Guid brandId, string imageUrl, int stock,
        List<string>? imageUrls = null, string? warranty = null, string? countryOfOrigin = null,
        string? dispatchInfo = null, string? shipsFrom = null, List<string>? offers = null)
    {
        Name = name; Description = description; Price = price; DiscountPercent = discountPercent;
        CategoryId = categoryId; BrandId = brandId; ImageUrl = imageUrl; Stock = stock;
        if (imageUrls != null) ImageUrls = imageUrls;
        Warranty = warranty; CountryOfOrigin = countryOfOrigin;
        DispatchInfo = dispatchInfo; ShipsFrom = shipsFrom;
        if (offers != null) Offers = offers;
        SetUpdated();
    }

    public void SetSlug(string slug) { Slug = slug; }

    public void UpdateRating(decimal rating, int reviewCount)
    {
        Rating = rating; ReviewCount = reviewCount; SetUpdated();
    }

    public void Activate() { IsActive = true; SetUpdated(); }
    public void Deactivate() { IsActive = false; SetUpdated(); }
}
