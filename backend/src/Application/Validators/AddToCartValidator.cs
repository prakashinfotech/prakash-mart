using PrakashMart.Application.DTOs.Cart;
using FluentValidation;

namespace PrakashMart.Application.Validators;

public class AddToCartValidator : AbstractValidator<AddToCartDto>
{
    public AddToCartValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.Quantity).InclusiveBetween(1, 10);
    }
}
