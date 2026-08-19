using PrakashMart.Application.Common.Exceptions;
using PrakashMart.Application.DTOs.Auth;
using PrakashMart.Application.Interfaces;
using PrakashMart.Application.Services;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace Application.Tests.Auth;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _userRepo = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly Mock<IPasswordHasher> _hasher = new();
    private readonly Mock<IJwtService> _jwt = new();
    private readonly Mock<IEmailService> _email = new();
    private readonly Mock<IWalletService> _wallet = new();
    private readonly AuthService _sut;

    public AuthServiceTests()
    {
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _wallet.Setup(w => w.CreditAsync(It.IsAny<Guid>(), It.IsAny<decimal>(), It.IsAny<string>(), null)).Returns(Task.CompletedTask);
        _sut = new AuthService(_userRepo.Object, _uow.Object, _hasher.Object, _jwt.Object, _email.Object, _wallet.Object);
    }

    // ── Register ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Register_ThrowsAppException_WhenEmailAlreadyExists()
    {
        _userRepo.Setup(r => r.EmailExistsAsync("taken@test.com")).ReturnsAsync(true);

        var act = () => _sut.RegisterAsync(new RegisterDto("Alice", "taken@test.com", "Pass@1", "Pass@1"));

        await act.Should().ThrowAsync<AppException>().WithMessage("*already registered*");
    }

    [Fact]
    public async Task Register_ReturnsAuthResponse_WhenEmailIsNew()
    {
        _userRepo.Setup(r => r.EmailExistsAsync("new@test.com")).ReturnsAsync(false);
        _hasher.Setup(h => h.Hash(It.IsAny<string>())).Returns("hashed");
        _jwt.Setup(j => j.GenerateToken(It.IsAny<User>())).Returns("jwt-token");
        _userRepo.Setup(r => r.AddAsync(It.IsAny<User>())).Returns(Task.CompletedTask);
        _email.Setup(e => e.SendWelcomeEmailAsync(It.IsAny<string>(), It.IsAny<string>())).Returns(Task.CompletedTask);

        var result = await _sut.RegisterAsync(new RegisterDto("Alice", "new@test.com", "Pass@1", "Pass@1"));

        result.Token.Should().Be("jwt-token");
        result.Email.Should().Be("new@test.com");
        result.Role.Should().Be("Customer");
    }

    [Fact]
    public async Task Register_SendsWelcomeEmail_WhenRegistrationSucceeds()
    {
        _userRepo.Setup(r => r.EmailExistsAsync("alice@test.com")).ReturnsAsync(false);
        _hasher.Setup(h => h.Hash(It.IsAny<string>())).Returns("hashed");
        _jwt.Setup(j => j.GenerateToken(It.IsAny<User>())).Returns("jwt-token");
        _userRepo.Setup(r => r.AddAsync(It.IsAny<User>())).Returns(Task.CompletedTask);
        _email.Setup(e => e.SendWelcomeEmailAsync(It.IsAny<string>(), It.IsAny<string>())).Returns(Task.CompletedTask);

        await _sut.RegisterAsync(new RegisterDto("Alice", "alice@test.com", "Pass@1", "Pass@1"));

        _email.Verify(e => e.SendWelcomeEmailAsync("alice@test.com", "Alice"), Times.Once);
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_ThrowsUnauthorizedException_WhenUserNotFound()
    {
        _userRepo.Setup(r => r.GetByEmailAsync("ghost@test.com")).ReturnsAsync((User?)null);

        var act = () => _sut.LoginAsync(new LoginDto("ghost@test.com", "pass"));

        await act.Should().ThrowAsync<UnauthorizedException>();
    }

    [Fact]
    public async Task Login_ThrowsUnauthorizedException_WhenPasswordIsWrong()
    {
        var user = User.Create("Bob", "bob@test.com", "hashed");
        _userRepo.Setup(r => r.GetByEmailAsync("bob@test.com")).ReturnsAsync(user);
        _hasher.Setup(h => h.Verify("wrong", "hashed")).Returns(false);

        var act = () => _sut.LoginAsync(new LoginDto("bob@test.com", "wrong"));

        await act.Should().ThrowAsync<UnauthorizedException>().WithMessage("*Invalid*");
    }

    [Fact]
    public async Task Login_ThrowsUnauthorizedException_WhenAccountIsDeactivated()
    {
        var user = User.Create("Bob", "bob@test.com", "hashed");
        user.ToggleActive(); // IsActive = false
        _userRepo.Setup(r => r.GetByEmailAsync("bob@test.com")).ReturnsAsync(user);
        _hasher.Setup(h => h.Verify("pass", "hashed")).Returns(true);

        var act = () => _sut.LoginAsync(new LoginDto("bob@test.com", "pass"));

        await act.Should().ThrowAsync<UnauthorizedException>().WithMessage("*deactivated*");
    }

    [Fact]
    public async Task Login_ReturnsToken_WhenCredentialsAreValid()
    {
        var user = User.Create("Bob", "bob@test.com", "hashed");
        _userRepo.Setup(r => r.GetByEmailAsync("bob@test.com")).ReturnsAsync(user);
        _hasher.Setup(h => h.Verify("pass", "hashed")).Returns(true);
        _jwt.Setup(j => j.GenerateToken(user)).Returns("valid-token");

        var result = await _sut.LoginAsync(new LoginDto("bob@test.com", "pass"));

        result.Token.Should().Be("valid-token");
        result.Email.Should().Be("bob@test.com");
    }
}
