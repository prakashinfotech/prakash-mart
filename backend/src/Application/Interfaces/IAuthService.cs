using PrakashMart.Application.DTOs.Auth;

namespace PrakashMart.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
    Task<AuthResponseDto> UpdateProfileAsync(Guid userId, UpdateProfileDto dto);
    Task ForgotPasswordAsync(ForgotPasswordDto dto, string frontendUrl);
    Task ResetPasswordAsync(ResetPasswordDto dto);
    Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto);
}
