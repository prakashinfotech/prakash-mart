using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace PrakashMart.Infrastructure.Persistence.Repositories;

public class WalletRepository(AppDbContext db) : IWalletRepository
{
    public async Task<Wallet?> GetByUserIdAsync(Guid userId)
        => await db.Wallets.Include(w => w.Transactions).FirstOrDefaultAsync(w => w.UserId == userId);

    public async Task AddAsync(Wallet wallet) => await db.Wallets.AddAsync(wallet);

    public void Update(Wallet wallet) => db.Wallets.Update(wallet);

    public async Task AddTransactionAsync(WalletTransaction transaction)
        => await db.WalletTransactions.AddAsync(transaction);
}
