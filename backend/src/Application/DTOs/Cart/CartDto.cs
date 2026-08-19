namespace PrakashMart.Application.DTOs.Cart;

public record CartDto(Guid CartId, IEnumerable<CartItemDto> Items, decimal Total);
