using PrakashMart.Application.Common.Exceptions;
using PrakashMart.Application.DTOs.Cart;
using PrakashMart.Application.Interfaces;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;

namespace PrakashMart.Application.Services;

public class CartService(
    ICartRepository cartRepository,
    IProductRepository productRepository,
    IProductVariantRepository variantRepository,
    IUnitOfWork unitOfWork) : ICartService
{
    public async Task<CartDto> GetCartAsync(Guid userId)
    {
        var cart = await GetOrCreateCartAsync(userId);
        return MapCart(cart);
    }

    public async Task<CartDto> AddItemAsync(Guid userId, AddToCartDto dto)
    {
        var product = await productRepository.GetByIdAsync(dto.ProductId)
            ?? throw new NotFoundException("Product not found.");

        decimal unitPrice = product.Price;
        string? variantLabel = null;

        if (dto.VariantId.HasValue)
        {
            var variant = await variantRepository.GetByIdAsync(dto.VariantId.Value)
                ?? throw new NotFoundException("Variant not found.");
            if (!variant.IsActive)
                throw new AppException("This variant is no longer available.");
            if (!variant.CanFulfill(dto.Quantity))
                throw new AppException($"Insufficient stock. Only {variant.AvailableStock} unit(s) available.");
            unitPrice = variant.PriceOverride ?? product.Price;
            variantLabel = variant.Label;
        }
        else
        {
            // All products in this system require a variant selection
            throw new AppException("Please select a variant to add to cart.");
        }

        var cart = await GetOrCreateCartAsync(userId);
        var existing = cart.Items.FirstOrDefault(i => i.ProductId == dto.ProductId && i.VariantId == dto.VariantId);

        if (existing != null)
            existing.UpdateQuantity(existing.Quantity + dto.Quantity);
        else
            cart.Items.Add(CartItem.Create(cart.Id, dto.ProductId, unitPrice, dto.Quantity, dto.VariantId, variantLabel));

        cartRepository.Update(cart);
        await unitOfWork.SaveChangesAsync();

        return MapCart(await cartRepository.GetByUserIdWithItemsAsync(userId) ?? cart);
    }

    public async Task<CartDto> UpdateItemAsync(Guid userId, Guid cartItemId, int quantity)
    {
        var cart = await cartRepository.GetByUserIdWithItemsAsync(userId)
            ?? throw new NotFoundException("Cart not found.");

        var item = cart.Items.FirstOrDefault(i => i.Id == cartItemId)
            ?? throw new NotFoundException("Cart item not found.");

        if (quantity <= 0)
        {
            cart.Items.Remove(item);
        }
        else
        {
            // Re-validate stock on every quantity change — cart items are not reservations
            if (item.VariantId.HasValue)
            {
                var variant = await variantRepository.GetByIdAsync(item.VariantId.Value);
                if (variant is null || !variant.IsActive || !variant.CanFulfill(quantity))
                    throw new AppException("Requested quantity exceeds available stock.");
            }
            item.UpdateQuantity(quantity);
        }

        cartRepository.Update(cart);
        await unitOfWork.SaveChangesAsync();

        return MapCart(await cartRepository.GetByUserIdWithItemsAsync(userId) ?? cart);
    }

    public async Task<CartDto> RemoveItemAsync(Guid userId, Guid cartItemId)
    {
        var cart = await cartRepository.GetByUserIdWithItemsAsync(userId)
            ?? throw new NotFoundException("Cart not found.");

        var item = cart.Items.FirstOrDefault(i => i.Id == cartItemId)
            ?? throw new NotFoundException("Cart item not found.");

        cart.Items.Remove(item);
        cartRepository.Update(cart);
        await unitOfWork.SaveChangesAsync();

        return MapCart(await cartRepository.GetByUserIdWithItemsAsync(userId) ?? cart);
    }

    public async Task ClearCartAsync(Guid userId)
    {
        var cart = await cartRepository.GetByUserIdWithItemsAsync(userId);
        if (cart is null) return;

        cart.Items.Clear();
        cartRepository.Update(cart);
        await unitOfWork.SaveChangesAsync();
    }

    private async Task<Cart> GetOrCreateCartAsync(Guid userId)
    {
        var cart = await cartRepository.GetByUserIdWithItemsAsync(userId);
        if (cart != null) return cart;

        cart = Cart.Create(userId);
        await cartRepository.AddAsync(cart);
        await unitOfWork.SaveChangesAsync();
        return cart;
    }

    private static CartDto MapCart(Cart cart)
    {
        var items = cart.Items.Select(i => new CartItemDto(
            i.Id, i.ProductId, string.Empty, string.Empty,
            i.UnitPrice, i.Quantity, i.UnitPrice * i.Quantity,
            i.VariantId, i.VariantLabel)).ToList();
        return new CartDto(cart.Id, items, items.Sum(i => i.Subtotal));
    }
}
