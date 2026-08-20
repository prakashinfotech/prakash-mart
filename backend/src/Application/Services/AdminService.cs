using PrakashMart.Application.Common.Exceptions;
using PrakashMart.Application.DTOs.Admin;
using PrakashMart.Application.DTOs.Products;
using PrakashMart.Application.Interfaces;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Enums;
using PrakashMart.Domain.Interfaces;

namespace PrakashMart.Application.Services;

public class AdminService(
    IOrderRepository orderRepository,
    IUserRepository userRepository,
    IProductRepository productRepository,
    IUnitOfWork unitOfWork,
    IPasswordHasher passwordHasher) : IAdminService
{
    public async Task<AdminStatsDto> GetStatsAsync()
    {
        var orders = (await orderRepository.GetAllAsync()).ToList();
        var users = (await userRepository.GetAllAsync()).ToList();
        var products = (await productRepository.GetFilteredAsync(null, null, null, null, null)).ToList();

        var sixMonthsAgo = DateTime.UtcNow.AddMonths(-5);
        var monthly = orders
            .Where(o => o.CreatedAt >= new DateTime(sixMonthsAgo.Year, sixMonthsAgo.Month, 1))
            .GroupBy(o => new { o.CreatedAt.Year, o.CreatedAt.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .Select(g => new AdminMonthlyRevenueDto(
                new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM yyyy"),
                g.Sum(o => o.TotalAmount),
                g.Count()))
            .ToList();

        var productCategoryMap = products.ToDictionary(p => p.Id, p => p.Category?.Name ?? "Unknown");
        var topCategories = orders
            .SelectMany(o => o.Items)
            .Where(i => productCategoryMap.ContainsKey(i.ProductId))
            .GroupBy(i => productCategoryMap[i.ProductId])
            .Select(g => new AdminCategoryRevenueDto(g.Key, g.Sum(i => i.UnitPrice * i.Quantity)))
            .OrderByDescending(c => c.Revenue)
            .Take(5)
            .ToList();

        return new AdminStatsDto(
            orders.Count,
            users.Count(u => u.Role == UserRole.Seller),
            products.Count,
            orders.Sum(o => o.TotalAmount),
            users.Count(u => u.Role == UserRole.Customer),
            monthly,
            topCategories);
    }

    public async Task<IEnumerable<SellerSummaryDto>> GetSellersAsync()
    {
        var users = await userRepository.GetAllAsync();
        var products = await productRepository.GetFilteredAsync(null, null, null, null, null);
        return users.Where(u => u.Role == UserRole.Seller)
            .Select(u => new SellerSummaryDto(u.Id, u.Name, u.Email,
                products.Count(p => p.SellerId == u.Id), u.CreatedAt, u.IsActive))
            .OrderBy(s => s.Name);
    }

    public async Task<SellerSummaryDto> CreateSellerAsync(CreateSellerDto dto)
    {
        if (await userRepository.EmailExistsAsync(dto.Email))
            throw new AppException("A user with this email already exists.", 409);

        var hash = passwordHasher.Hash(dto.Password);
        var seller = User.Create(dto.Name, dto.Email, hash, UserRole.Seller);
        await userRepository.AddAsync(seller);
        await unitOfWork.SaveChangesAsync();
        return new SellerSummaryDto(seller.Id, seller.Name, seller.Email, 0, seller.CreatedAt, seller.IsActive);
    }

    public async Task<SellerSummaryDto> ToggleSellerActiveAsync(Guid sellerId)
    {
        var seller = await userRepository.GetByIdAsync(sellerId)
            ?? throw new NotFoundException("Seller not found.");
        if (seller.Role != UserRole.Seller)
            throw new ForbiddenException("User is not a seller.");
        seller.ToggleActive();
        userRepository.Update(seller);
        await unitOfWork.SaveChangesAsync();
        var products = await productRepository.GetFilteredAsync(null, null, null, null, null);
        return new SellerSummaryDto(seller.Id, seller.Name, seller.Email,
            products.Count(p => p.SellerId == seller.Id), seller.CreatedAt, seller.IsActive);
    }

    public async Task<IEnumerable<UserSummaryDto>> GetAllUsersAsync()
    {
        var users = await userRepository.GetAllAsync();
        return users.Select(u => new UserSummaryDto(u.Id, u.Name, u.Email, u.Role.ToString(), u.IsActive, u.CreatedAt));
    }

    public async Task<UserSummaryDto> ToggleUserActiveAsync(Guid userId)
    {
        var user = await userRepository.GetByIdAsync(userId)
            ?? throw new NotFoundException("User not found.");
        user.ToggleActive();
        userRepository.Update(user);
        await unitOfWork.SaveChangesAsync();
        return new UserSummaryDto(user.Id, user.Name, user.Email, user.Role.ToString(), user.IsActive, user.CreatedAt);
    }

    public async Task<ProductDto> ToggleProductActiveAsync(Guid productId)
    {
        var product = await productRepository.GetByIdAsync(productId)
            ?? throw new NotFoundException("Product not found.");
        if (product.IsActive) product.Deactivate();
        else product.Activate();
        productRepository.Update(product);
        await unitOfWork.SaveChangesAsync();
        var activeVariants = product.Variants.Where(v => v.IsActive).ToList();
        var effectiveStock = activeVariants.Sum(v => v.AvailableStock);
        return new ProductDto(product.Id, product.Name, product.Description, product.Price, product.DiscountPercent,
            product.Category?.Name ?? string.Empty, product.CategoryId, product.BrandId, product.Brand?.Name ?? string.Empty,
            product.ImageUrl, product.ImageUrls, effectiveStock, product.Rating, product.ReviewCount,
            product.SellerId, product.Seller?.Name ?? string.Empty,
            product.Warranty, product.CountryOfOrigin, product.DispatchInfo, product.ShipsFrom, product.Offers,
            null, [], product.Slug);
    }
}
