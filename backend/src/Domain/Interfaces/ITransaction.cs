namespace PrakashMart.Domain.Interfaces;

public interface ITransaction : IAsyncDisposable
{
    Task CommitAsync();
    Task RollbackAsync();
}
