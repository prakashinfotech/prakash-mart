namespace PrakashMart.Application.DTOs.Auth;

public record ResetPasswordDto(string Token, string NewPassword, string ConfirmPassword);
