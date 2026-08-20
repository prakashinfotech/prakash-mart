namespace PrakashMart.Application.DTOs.Auth;

public record AuthResponseDto(Guid UserId, string Name, string Email, string Role, string Token);
