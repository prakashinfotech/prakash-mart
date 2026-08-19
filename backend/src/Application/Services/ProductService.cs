using System.Text.Json;
using System.Text.RegularExpressions;
using PrakashMart.Application.Common.Exceptions;
using PrakashMart.Application.DTOs.Products;
using PrakashMart.Application.Interfaces;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;

namespace PrakashMart.Application.Services;

public class ProductService(
    IProductRepository productRepository,
    ICategoryRepository categoryRepository,
    IBrandRepository brandRepository,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork) : IProductService
{
    public async Task<IEnumerable<ProductDto>> GetFilteredAsync(ProductFilterDto filter)
    {
        var products = await productRepository.GetFilteredAsync(
            filter.Category, filter.BrandId, filter.MinPrice, filter.MaxPrice, filter.MinRating, filter.Size, filter.Color);
        return products.Select(p => Map(p));
    }

    public async Task<VariantOptionsDto> GetVariantOptionsAsync()
    {
        var (sizes, colors) = await productRepository.GetVariantOptionsAsync();
        return new VariantOptionsDto(sizes, colors);
    }

    public async Task<IEnumerable<SuggestionDto>> GetSuggestionsAsync(string q, int limit = 8)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2)
            return [];

        var results = await productRepository.GetSuggestionsAsync(q.Trim(), limit);
        return results.Select(r => new SuggestionDto(r.Term, r.Type));
    }

    public async Task<ProductDto> GetByIdAsync(Guid id)
    {
        var product = await productRepository.GetByIdAsync(id)
            ?? throw new NotFoundException("Product not found.");
        return Map(product);
    }

    public async Task<ProductDto> GetBySlugAsync(string slug)
    {
        var product = await productRepository.GetBySlugAsync(slug)
            ?? throw new NotFoundException("Product not found.");
        return Map(product);
    }

    public async Task<ProductDto> CreateAsync(CreateProductDto dto, Guid sellerId)
    {
        var seller = await userRepository.GetByIdAsync(sellerId)
            ?? throw new NotFoundException("Seller not found.");

        var category = await categoryRepository.GetByIdAsync(dto.CategoryId)
            ?? throw new NotFoundException("Category not found.");

        var brand = await brandRepository.GetByIdAsync(dto.BrandId)
            ?? throw new NotFoundException("Brand not found.");

        var product = Product.Create(
            dto.Name, dto.Description, dto.Price, dto.DiscountPercent,
            dto.CategoryId, dto.BrandId, dto.ImageUrl, dto.Stock, sellerId,
            dto.ImageUrls, dto.Warranty, dto.CountryOfOrigin, dto.DispatchInfo, dto.ShipsFrom, dto.Offers);

        product.SetSlug(await UniqueSlugAsync(dto.Name));

        await productRepository.AddAsync(product);
        await unitOfWork.SaveChangesAsync();

        return Map(product, seller.Name, category.Name, brand.Name);
    }

    public async Task<ProductDto> UpdateAsync(Guid id, UpdateProductDto dto, Guid sellerId)
    {
        var product = await productRepository.GetByIdAsync(id)
            ?? throw new NotFoundException("Product not found.");

        if (product.SellerId != sellerId)
            throw new ForbiddenException("You can only update your own products.");

        var category = await categoryRepository.GetByIdAsync(dto.CategoryId)
            ?? throw new NotFoundException("Category not found.");

        var brand = await brandRepository.GetByIdAsync(dto.BrandId)
            ?? throw new NotFoundException("Brand not found.");

        product.Update(dto.Name, dto.Description, dto.Price, dto.DiscountPercent,
            dto.CategoryId, dto.BrandId, dto.ImageUrl, dto.Stock,
            dto.ImageUrls, dto.Warranty, dto.CountryOfOrigin, dto.DispatchInfo, dto.ShipsFrom, dto.Offers);

        productRepository.Update(product);
        await unitOfWork.SaveChangesAsync();

        var seller = await userRepository.GetByIdAsync(sellerId);
        return Map(product, seller?.Name ?? string.Empty, category.Name, brand.Name);
    }

    public async Task DeleteAsync(Guid id, Guid sellerId)
    {
        var product = await productRepository.GetByIdAsync(id)
            ?? throw new NotFoundException("Product not found.");

        if (product.SellerId != sellerId)
            throw new ForbiddenException("You can only delete your own products.");

        product.Deactivate();
        productRepository.Update(product);
        await unitOfWork.SaveChangesAsync();
    }

    private async Task<string> UniqueSlugAsync(string name, Guid? excludeId = null)
    {
        var base_ = Slugify(name);
        var candidate = base_;
        var n = 2;
        while (await productRepository.SlugExistsAsync(candidate, excludeId))
            candidate = $"{base_}-{n++}";
        return candidate;
    }

    private static string Slugify(string name)
    {
        var s = name.ToLowerInvariant();
        s = Regex.Replace(s, @"[^a-z0-9\s-]", "");
        s = s.Trim();
        s = Regex.Replace(s, @"\s+", "-");
        s = Regex.Replace(s, @"-+", "-");
        return s;
    }

    private static ProductDto Map(Product p, string? sellerName = null, string? categoryName = null, string? brandName = null)
    {
        var activeVariants = p.Variants.Where(v => v.IsActive).ToList();
        var effectiveStock = activeVariants.Sum(v => v.AvailableStock);

        // Minimum variant price — only set when at least one variant has a price override
        decimal? minVariantPrice = null;
        if (activeVariants.Count > 0 && activeVariants.Any(v => v.PriceOverride.HasValue))
            minVariantPrice = activeVariants.Select(v => v.PriceOverride ?? p.Price).Min();

        // Color options — distinct values of any "Color"/"Colour"-keyed attribute
        var colorOptions = new List<string>();
        foreach (var v in activeVariants)
        {
            try
            {
                var attrs = JsonSerializer.Deserialize<Dictionary<string, string>>(v.Attributes) ?? [];
                foreach (var (key, val) in attrs)
                    if ((key.Equals("Color", StringComparison.OrdinalIgnoreCase) ||
                         key.Equals("Colour", StringComparison.OrdinalIgnoreCase)) &&
                        !colorOptions.Contains(val))
                        colorOptions.Add(val);
            }
            catch { /* malformed JSON — skip */ }
        }

        return new(p.Id, p.Name, p.Description, p.Price, p.DiscountPercent,
            categoryName ?? p.Category?.Name ?? string.Empty,
            p.CategoryId,
            p.BrandId, brandName ?? p.Brand?.Name ?? string.Empty,
            p.ImageUrl, p.ImageUrls, effectiveStock, p.Rating, p.ReviewCount,
            p.SellerId, sellerName ?? p.Seller?.Name ?? string.Empty,
            p.Warranty, p.CountryOfOrigin, p.DispatchInfo, p.ShipsFrom, p.Offers,
            minVariantPrice, colorOptions, p.Slug);
    }
}
