namespace PrakashMart.Application.DTOs.Auth;

public record ChangePasswordDto(string CurrentPassword, string NewPassword, string ConfirmPassword);
