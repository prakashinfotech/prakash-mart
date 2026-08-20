using PrakashMart.Domain.Enums;

namespace PrakashMart.Domain.Entities;

public class User : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public UserRole Role { get; private set; } = UserRole.Customer;
    public bool IsActive { get; private set; } = true;
    public string? PasswordResetToken { get; private set; }
    public DateTime? PasswordResetTokenExpiresAt { get; private set; }

    private User() { }

    public static User Create(string name, string email, string passwordHash, UserRole role = UserRole.Customer)
        => new() { Name = name, Email = email, PasswordHash = passwordHash, Role = role };

    public void ToggleActive() { IsActive = !IsActive; SetUpdated(); }
    public void UpdateProfile(string name) { Name = name; SetUpdated(); }
    public void SetPassword(string passwordHash) { PasswordHash = passwordHash; SetUpdated(); }

    public void SetPasswordResetToken(string token, DateTime expiresAt)
    {
        PasswordResetToken = token;
        PasswordResetTokenExpiresAt = expiresAt;
        SetUpdated();
    }

    public void ClearPasswordResetToken()
    {
        PasswordResetToken = null;
        PasswordResetTokenExpiresAt = null;
        SetUpdated();
    }
}
