using System.Security.Cryptography;
using PrakashMart.Application.Common.Exceptions;
using PrakashMart.Application.DTOs.Auth;
using PrakashMart.Application.Interfaces;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Enums;
using PrakashMart.Domain.Interfaces;

namespace PrakashMart.Application.Services;

public class AuthService(
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    IPasswordHasher passwordHasher,
    IJwtService jwtService,
    IEmailService emailService,
    IWalletService walletService) : IAuthService
{
    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        if (await userRepository.EmailExistsAsync(dto.Email))
            throw new AppException("Email is already registered.");

        var hash = passwordHasher.Hash(dto.Password);
        var user = User.Create(dto.Name, dto.Email, hash, UserRole.Customer);

        await userRepository.AddAsync(user);
        await unitOfWork.SaveChangesAsync();

        await walletService.CreditAsync(user.Id, 50, "Welcome bonus — thanks for joining PrakashMart!");

        _ = emailService.SendWelcomeEmailAsync(user.Email, user.Name);

        return BuildResponse(user);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await userRepository.GetByEmailAsync(dto.Email)
            ?? throw new UnauthorizedException("Invalid email or password.");

        if (!passwordHasher.Verify(dto.Password, user.PasswordHash))
            throw new UnauthorizedException("Invalid email or password.");

        if (!user.IsActive)
            throw new UnauthorizedException("Your account has been deactivated. Please contact support.");

        return BuildResponse(user);
    }

    public async Task<AuthResponseDto> UpdateProfileAsync(Guid userId, UpdateProfileDto dto)
    {
        var user = await userRepository.GetByIdAsync(userId)
            ?? throw new NotFoundException("User not found.");
        user.UpdateProfile(dto.Name);
        userRepository.Update(user);
        await unitOfWork.SaveChangesAsync();
        return BuildResponse(user);
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto)
    {
        if (dto.NewPassword != dto.ConfirmPassword)
            throw new AppException("Passwords do not match.");

        var user = await userRepository.GetByIdAsync(userId)
            ?? throw new NotFoundException("User not found.");

        if (!passwordHasher.Verify(dto.CurrentPassword, user.PasswordHash))
            throw new AppException("Current password is incorrect.");

        user.SetPassword(passwordHasher.Hash(dto.NewPassword));
        userRepository.Update(user);
        await unitOfWork.SaveChangesAsync();
    }

    public async Task ForgotPasswordAsync(ForgotPasswordDto dto, string frontendUrl)
    {
        var user = await userRepository.GetByEmailAsync(dto.Email);
        if (user is null) return; // never reveal whether the email exists

        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        user.SetPasswordResetToken(token, DateTime.UtcNow.AddHours(1));
        userRepository.Update(user);
        await unitOfWork.SaveChangesAsync();

        var resetUrl = $"{frontendUrl.TrimEnd('/')}/reset-password?token={token}";
        _ = emailService.SendPasswordResetEmailAsync(user.Email, user.Name, resetUrl);
    }

    public async Task ResetPasswordAsync(ResetPasswordDto dto)
    {
        if (dto.NewPassword != dto.ConfirmPassword)
            throw new AppException("Passwords do not match.");

        var user = await userRepository.GetByPasswordResetTokenAsync(dto.Token)
            ?? throw new AppException("Invalid or expired reset link.");

        if (user.PasswordResetTokenExpiresAt < DateTime.UtcNow)
            throw new AppException("Reset link has expired. Please request a new one.");

        user.SetPassword(passwordHasher.Hash(dto.NewPassword));
        user.ClearPasswordResetToken();
        userRepository.Update(user);
        await unitOfWork.SaveChangesAsync();
    }

    private AuthResponseDto BuildResponse(User user) =>
        new(user.Id, user.Name, user.Email, user.Role.ToString(), jwtService.GenerateToken(user));
}
