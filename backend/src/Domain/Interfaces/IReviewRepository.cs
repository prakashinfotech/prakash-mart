using PrakashMart.Domain.Entities;

namespace PrakashMart.Domain.Interfaces;

public interface IReviewRepository : IRepository<Review>
{
    Task<IEnumerable<Review>> GetByProductIdAsync(Guid productId);
    Task<bool> HasUserReviewedAsync(Guid productId, Guid userId);
}
