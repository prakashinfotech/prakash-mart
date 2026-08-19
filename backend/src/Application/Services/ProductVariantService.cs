using System.Text.Json;
using PrakashMart.Application.Common.Exceptions;
using PrakashMart.Application.DTOs.Variants;
using PrakashMart.Application.Interfaces;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Enums;
using PrakashMart.Domain.Interfaces;

namespace PrakashMart.Application.Services;

public class ProductVariantService(
    IProductVariantRepository variantRepository,
    IProductRepository productRepository,
    IInventoryService inventoryService,
    IUnitOfWork unitOfWork) : IProductVariantService
{
    private static readonly JsonSerializerOptions _jsonOpts = new() { PropertyNameCaseInsensitive = true };

    private static Dictionary<string, string> ParseAttributes(string json)
    {
        try { return JsonSerializer.Deserialize<Dictionary<string, string>>(json, _jsonOpts) ?? []; }
        catch { return []; }
    }

    private static ProductVariantDto ToDto(ProductVariant v) =>
        new(v.Id, v.ProductId, v.SKU, v.Barcode, ParseAttributes(v.Attributes),
            v.Stock, v.ReservedQuantity, v.AvailableStock, v.PriceOverride, v.IsActive, v.Label);

    public async Task<IEnumerable<ProductVariantDto>> GetByProductAsync(Guid productId)
        => (await variantRepository.GetByProductIdAsync(productId)).Select(ToDto);

    public async Task<ProductVariantDto> CreateAsync(Guid productId, CreateVariantDto dto, Guid sellerId)
    {
        var product = await productRepository.GetByIdAsync(productId)
            ?? throw new NotFoundException("Product not found.");

        if (product.SellerId != sellerId)
            throw new ForbiddenException("You do not own this product.");

        var attrsJson = JsonSerializer.Serialize(dto.Attributes);
        var variant = ProductVariant.Create(productId, attrsJson, dto.Stock, dto.PriceOverride, dto.SKU);
        await variantRepository.AddAsync(variant);

        if (dto.Stock > 0)
            await inventoryService.RecordAsync(
                variant.Id, InventoryChangeType.InitialStock,
                0, dto.Stock,
                $"Initial stock set to {dto.Stock}",
                referenceId: null, createdBy: sellerId);

        await unitOfWork.SaveChangesAsync();
        return ToDto(variant);
    }

    public async Task<ProductVariantDto> UpdateAsync(Guid variantId, UpdateVariantDto dto, Guid sellerId)
    {
        var variant = await variantRepository.GetByIdAsync(variantId)
            ?? throw new NotFoundException("Variant not found.");

        var product = await productRepository.GetByIdAsync(variant.ProductId)
            ?? throw new NotFoundException("Product not found.");

        if (product.SellerId != sellerId)
            throw new ForbiddenException("You do not own this product.");

        var stockBefore = variant.Stock;
        var attrsJson = JsonSerializer.Serialize(dto.Attributes);
        variant.Update(attrsJson, dto.Stock, dto.PriceOverride, dto.Barcode);
        variantRepository.Update(variant);

        if (stockBefore != dto.Stock)
            await inventoryService.RecordAsync(
                variant.Id, InventoryChangeType.SellerUpdate,
                stockBefore, dto.Stock,
                $"Seller updated stock from {stockBefore} to {dto.Stock}",
                referenceId: null, createdBy: sellerId);

        await unitOfWork.SaveChangesAsync();
        return ToDto(variant);
    }

    public async Task ToggleActiveAsync(Guid variantId, Guid sellerId)
    {
        var variant = await variantRepository.GetByIdAsync(variantId)
            ?? throw new NotFoundException("Variant not found.");

        var product = await productRepository.GetByIdAsync(variant.ProductId)
            ?? throw new NotFoundException("Product not found.");

        if (product.SellerId != sellerId)
            throw new ForbiddenException("You do not own this product.");

        variant.SetActive(!variant.IsActive);
        variantRepository.Update(variant);
        await unitOfWork.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid variantId, Guid sellerId)
    {
        var variant = await variantRepository.GetByIdAsync(variantId)
            ?? throw new NotFoundException("Variant not found.");

        var product = await productRepository.GetByIdAsync(variant.ProductId)
            ?? throw new NotFoundException("Product not found.");

        if (product.SellerId != sellerId)
            throw new ForbiddenException("You do not own this product.");

        variantRepository.Delete(variant);
        await unitOfWork.SaveChangesAsync();
    }
}
