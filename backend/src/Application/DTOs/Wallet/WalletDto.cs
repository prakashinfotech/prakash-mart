namespace PrakashMart.Application.DTOs.Wallet;

public record WalletDto(Guid Id, decimal Balance, IEnumerable<WalletTransactionDto> Transactions);

public record WalletTransactionDto(Guid Id, decimal Amount, string Type, string Description, Guid? OrderId, DateTime CreatedAt);
