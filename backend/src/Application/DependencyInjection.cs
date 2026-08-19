using PrakashMart.Application.Interfaces;
using PrakashMart.Application.Services;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace PrakashMart.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAddressService, AddressService>();
        services.AddScoped<IAdminService, AdminService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IBrandService, BrandService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<ICartService, CartService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IReviewService, ReviewService>();
        services.AddScoped<ICouponService, CouponService>();
        services.AddScoped<IBannerService, BannerService>();
        services.AddScoped<IProductVariantService, ProductVariantService>();
        services.AddScoped<IVariantTypeService, VariantTypeService>();
        services.AddScoped<ISellerAnalyticsService, SellerAnalyticsService>();
        services.AddScoped<IWalletService, WalletService>();
        services.AddScoped<IOrderReturnService, OrderReturnService>();
        services.AddScoped<IInventoryService, InventoryService>();
        services.AddScoped<ICartReservationService, CartReservationService>();
        services.AddScoped<IInventoryForecastService, InventoryForecastService>();

        return services;
    }
}
