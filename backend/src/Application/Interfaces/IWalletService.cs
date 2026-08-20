using PrakashMart.Application.DTOs.Wallet;

namespace PrakashMart.Application.Interfaces;

public interface IWalletService
{
    Task<WalletDto> GetOrCreateAsync(Guid userId);
    Task CreditAsync(Guid userId, decimal amount, string description, Guid? orderId = null);
    Task<decimal> DebitAsync(Guid userId, decimal amount, string description, Guid? orderId = null);
    Task<decimal> GetBalanceAsync(Guid userId);
}
