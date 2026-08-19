using PrakashMart.Application.DTOs.Reviews;

namespace PrakashMart.Application.Interfaces;

public interface IReviewService
{
    Task<IEnumerable<ReviewDto>> GetByProductAsync(Guid productId);
    Task<ReviewDto> CreateAsync(Guid userId, CreateReviewDto dto);
    Task DeleteAsync(Guid reviewId, Guid userId);
    Task<CanReviewDto> CanReviewAsync(Guid userId, Guid productId);
}
