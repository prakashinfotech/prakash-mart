using PrakashMart.Domain.Interfaces;

namespace PrakashMart.Infrastructure.Persistence;

public class UnitOfWork(AppDbContext context) : IUnitOfWork
{
    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => context.SaveChangesAsync(cancellationToken);

    public async Task<ITransaction> BeginTransactionAsync()
        => new EfTransaction(await context.Database.BeginTransactionAsync());

    public void Dispose() => context.Dispose();
}
