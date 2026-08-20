namespace PrakashMart.Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<ITransaction> BeginTransactionAsync();
}
