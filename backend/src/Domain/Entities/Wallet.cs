using PrakashMart.Domain.Enums;

namespace PrakashMart.Domain.Entities;

public class Wallet : BaseEntity
{
    public Guid UserId { get; private set; }
    public decimal Balance { get; private set; }
    public ICollection<WalletTransaction> Transactions { get; private set; } = [];

    private Wallet() { }

    public static Wallet Create(Guid userId) => new() { UserId = userId, Balance = 0 };

    public void Credit(decimal amount) { Balance += amount; SetUpdated(); }

    public void Debit(decimal amount)
    {
        if (amount > Balance)
            throw new InvalidOperationException("Insufficient wallet balance.");
        Balance -= amount;
        SetUpdated();
    }
}

public class WalletTransaction : BaseEntity
{
    public Guid WalletId { get; private set; }
    public decimal Amount { get; private set; }
    public TransactionType Type { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public Guid? OrderId { get; private set; }

    private WalletTransaction() { }

    public static WalletTransaction Create(Guid walletId, decimal amount, TransactionType type, string description, Guid? orderId = null)
        => new() { WalletId = walletId, Amount = amount, Type = type, Description = description, OrderId = orderId };
}
