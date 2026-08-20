using PrakashMart.Application.DTOs.Wallet;
using PrakashMart.Application.Interfaces;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Enums;
using PrakashMart.Domain.Interfaces;

namespace PrakashMart.Application.Services;

public class WalletService(IWalletRepository walletRepository, IUnitOfWork unitOfWork) : IWalletService
{
    public async Task<WalletDto> GetOrCreateAsync(Guid userId)
    {
        var wallet = await walletRepository.GetByUserIdAsync(userId)
                     ?? await CreateWalletAsync(userId);
        return Map(wallet);
    }

    public async Task<decimal> GetBalanceAsync(Guid userId)
    {
        var wallet = await walletRepository.GetByUserIdAsync(userId);
        return wallet?.Balance ?? 0;
    }

    public async Task CreditAsync(Guid userId, decimal amount, string description, Guid? orderId = null)
    {
        var wallet = await GetOrCreateInternalAsync(userId);
        wallet.Credit(amount);
        await walletRepository.AddTransactionAsync(
            WalletTransaction.Create(wallet.Id, amount, TransactionType.Credit, description, orderId));
        walletRepository.Update(wallet);
        await unitOfWork.SaveChangesAsync();
    }

    public async Task<decimal> DebitAsync(Guid userId, decimal amount, string description, Guid? orderId = null)
    {
        var wallet = await GetOrCreateInternalAsync(userId);
        wallet.Debit(amount);
        await walletRepository.AddTransactionAsync(
            WalletTransaction.Create(wallet.Id, amount, TransactionType.Debit, description, orderId));
        walletRepository.Update(wallet);
        await unitOfWork.SaveChangesAsync();
        return wallet.Balance;
    }

    private async Task<Wallet> GetOrCreateInternalAsync(Guid userId)
    {
        var wallet = await walletRepository.GetByUserIdAsync(userId);
        if (wallet is not null) return wallet;
        return await CreateWalletAsync(userId);
    }

    private async Task<Wallet> CreateWalletAsync(Guid userId)
    {
        var wallet = Wallet.Create(userId);
        await walletRepository.AddAsync(wallet);
        await unitOfWork.SaveChangesAsync();
        return wallet;
    }

    private static WalletDto Map(Wallet w) => new(w.Id, w.Balance,
        w.Transactions.OrderByDescending(t => t.CreatedAt)
            .Select(t => new WalletTransactionDto(t.Id, t.Amount, t.Type.ToString(), t.Description, t.OrderId, t.CreatedAt)));
}
