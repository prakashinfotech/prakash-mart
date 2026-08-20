using PrakashMart.Application.DTOs.Products;
using FluentValidation;

namespace PrakashMart.Application.Validators;

public class CreateProductValidator : AbstractValidator<CreateProductDto>
{
    public CreateProductValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.Price).GreaterThan(0);
        RuleFor(x => x.DiscountPercent).InclusiveBetween(0, 100).When(x => x.DiscountPercent.HasValue);
        RuleFor(x => x.CategoryId).NotEmpty();
        RuleFor(x => x.BrandId).NotEmpty();
        RuleFor(x => x.ImageUrl).NotEmpty().MaximumLength(500);
        RuleFor(x => x.Stock).GreaterThanOrEqualTo(0);
    }
}
