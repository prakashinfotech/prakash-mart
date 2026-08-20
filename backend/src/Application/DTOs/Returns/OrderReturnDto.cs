namespace PrakashMart.Application.DTOs.Returns;

public record OrderReturnDto(
    Guid Id,
    Guid OrderId,
    string Reason,
    string Status,
    DateTime RequestedAt);

public record CreateReturnRequestDto(string Reason);

public record ProcessReturnDto(bool Approve);
