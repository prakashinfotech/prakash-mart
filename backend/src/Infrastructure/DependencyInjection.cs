using PrakashMart.Application.Interfaces;
using PrakashMart.Domain.Interfaces;
using PrakashMart.Infrastructure.Persistence;
using PrakashMart.Infrastructure.Persistence.Repositories;
using PrakashMart.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace PrakashMart.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(config.GetConnectionString("DefaultConnection")));

        services.AddScoped<IUnitOfWork, UnitOfWork>();

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IUserAddressRepository, UserAddressRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IBrandRepository, BrandRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<ICartRepository, CartRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IReviewRepository, ReviewRepository>();
        services.AddScoped<ICouponRepository, CouponRepository>();
        services.AddScoped<IBannerRepository, BannerRepository>();
        services.AddScoped<IProductVariantRepository, ProductVariantRepository>();
        services.AddScoped<IVariantTypeRepository, VariantTypeRepository>();

        services.AddScoped<IWalletRepository, WalletRepository>();
        services.AddScoped<IOrderReturnRepository, OrderReturnRepository>();
        services.AddScoped<IInventoryTransactionRepository, InventoryTransactionRepository>();
        services.AddScoped<ICartReservationRepository, CartReservationRepository>();
        services.AddScoped<IPushSubscriptionRepository, PushSubscriptionRepository>();
        services.AddScoped<IPushNotificationService, PushNotificationService>();

        services.AddScoped<IJwtService, JwtService>();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();

        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IInvoiceService, InvoiceService>();

        services.AddHttpClient<IPaymentService, PaymentService>();

        return services;
    }
}
