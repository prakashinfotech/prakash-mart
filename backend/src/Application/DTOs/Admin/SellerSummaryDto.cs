namespace PrakashMart.Application.DTOs.Admin;

public record SellerSummaryDto(Guid Id, string Name, string Email, int ProductCount, DateTime JoinedAt, bool IsActive);

public record CreateSellerDto(string Name, string Email, string Password);
