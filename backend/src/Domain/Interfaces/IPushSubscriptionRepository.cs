using PrakashMart.Domain.Entities;

namespace PrakashMart.Domain.Interfaces;

public interface IPushSubscriptionRepository
{
    Task<IEnumerable<PushSubscription>> GetByUserIdAsync(Guid userId);
    Task AddAsync(PushSubscription subscription);
    Task DeleteByEndpointAsync(string endpoint);
    Task SaveChangesAsync();
}
