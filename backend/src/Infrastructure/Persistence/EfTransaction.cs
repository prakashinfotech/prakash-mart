using PrakashMart.Domain.Interfaces;
using Microsoft.EntityFrameworkCore.Storage;

namespace PrakashMart.Infrastructure.Persistence;

internal sealed class EfTransaction(IDbContextTransaction inner) : ITransaction
{
    public Task CommitAsync() => inner.CommitAsync();
    public Task RollbackAsync() => inner.RollbackAsync();
    public ValueTask DisposeAsync() => inner.DisposeAsync();
}
