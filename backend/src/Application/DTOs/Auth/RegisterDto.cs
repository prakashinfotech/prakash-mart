namespace PrakashMart.Application.DTOs.Auth;

public record RegisterDto(string Name, string Email, string Password, string ConfirmPassword);
