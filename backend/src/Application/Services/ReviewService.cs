using PrakashMart.Application.Common.Exceptions;
using PrakashMart.Application.DTOs.Reviews;
using PrakashMart.Application.Interfaces;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;
using PrakashMart.Domain.Enums;

namespace PrakashMart.Application.Services;

public class ReviewService(
    IReviewRepository reviewRepository,
    IProductRepository productRepository,
    IOrderRepository orderRepository,
    IUnitOfWork unitOfWork) : IReviewService
{
    public async Task<IEnumerable<ReviewDto>> GetByProductAsync(Guid productId)
    {
        var reviews = await reviewRepository.GetByProductIdAsync(productId);
        return reviews.Select(MapReview);
    }

    public async Task<CanReviewDto> CanReviewAsync(Guid userId, Guid productId)
    {
        if (!await orderRepository.HasUserPurchasedProductAsync(userId, productId))
            return new CanReviewDto(false, "You can only review products you have purchased and received.");
        if (await reviewRepository.HasUserReviewedAsync(productId, userId))
            return new CanReviewDto(false, "You have already reviewed this product.");
        return new CanReviewDto(true, string.Empty);
    }

    public async Task<ReviewDto> CreateAsync(Guid userId, CreateReviewDto dto)
    {
        var product = await productRepository.GetByIdAsync(dto.ProductId)
            ?? throw new NotFoundException("Product not found.");

        if (!await orderRepository.HasUserPurchasedProductAsync(userId, dto.ProductId))
            throw new ForbiddenException("You can only review products you have purchased and received.");

        if (await reviewRepository.HasUserReviewedAsync(dto.ProductId, userId))
            throw new AppException("You have already reviewed this product.");

        var review = Review.Create(dto.ProductId, userId, dto.Rating, dto.Comment);
        await reviewRepository.AddAsync(review);

        var allReviews = (await reviewRepository.GetByProductIdAsync(dto.ProductId)).ToList();
        allReviews.Add(review);
        var avgRating = (decimal)allReviews.Average(r => r.Rating);
        product.UpdateRating(avgRating, allReviews.Count);
        productRepository.Update(product);

        await unitOfWork.SaveChangesAsync();
        return MapReview(review);
    }

    public async Task DeleteAsync(Guid reviewId, Guid userId)
    {
        var review = await reviewRepository.GetByIdAsync(reviewId)
            ?? throw new NotFoundException("Review not found.");

        if (review.UserId != userId)
            throw new ForbiddenException("You can only delete your own reviews.");

        reviewRepository.Delete(review);
        await unitOfWork.SaveChangesAsync();
    }

    private static ReviewDto MapReview(Review r) =>
        new(r.Id, r.ProductId, r.UserId, r.User?.Name ?? string.Empty, r.Rating, r.Comment, r.CreatedAt);
}
