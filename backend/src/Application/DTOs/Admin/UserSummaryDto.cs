namespace PrakashMart.Application.DTOs.Admin;

public record UserSummaryDto(Guid Id, string Name, string Email, string Role, bool IsActive, DateTime JoinedAt);
