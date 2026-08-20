namespace PrakashMart.Application.DTOs.Cart;

public record AddToCartDto(Guid ProductId, int Quantity, Guid? VariantId = null);
