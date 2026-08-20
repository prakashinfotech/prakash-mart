using PrakashMart.Domain.Entities;

namespace PrakashMart.Domain.Interfaces;

public interface IWalletRepository
{
    Task<Wallet?> GetByUserIdAsync(Guid userId);
    Task AddAsync(Wallet wallet);
    void Update(Wallet wallet);
    Task AddTransactionAsync(WalletTransaction transaction);
}
