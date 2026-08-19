using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace PrakashMart.Infrastructure.Persistence.Repositories;

public class PushSubscriptionRepository(AppDbContext context) : IPushSubscriptionRepository
{
    public async Task<IEnumerable<PushSubscription>> GetByUserIdAsync(Guid userId)
        => await context.PushSubscriptions.Where(s => s.UserId == userId).ToListAsync();

    public async Task AddAsync(PushSubscription subscription)
        => await context.PushSubscriptions.AddAsync(subscription);

    public async Task DeleteByEndpointAsync(string endpoint)
    {
        var sub = await context.PushSubscriptions.FirstOrDefaultAsync(s => s.Endpoint == endpoint);
        if (sub is not null)
        {
            context.PushSubscriptions.Remove(sub);
            await context.SaveChangesAsync();
        }
    }

    public async Task SaveChangesAsync()
        => await context.SaveChangesAsync();
}
