using PrakashMart.Application.DTOs.Cart;

namespace PrakashMart.Application.Interfaces;

public interface ICartService
{
    Task<CartDto> GetCartAsync(Guid userId);
    Task<CartDto> AddItemAsync(Guid userId, AddToCartDto dto);
    Task<CartDto> UpdateItemAsync(Guid userId, Guid cartItemId, int quantity);
    Task<CartDto> RemoveItemAsync(Guid userId, Guid cartItemId);
    Task ClearCartAsync(Guid userId);
}
