using PrakashMart.Domain.Entities;

namespace PrakashMart.Application.Interfaces;

public interface IJwtService
{
    string GenerateToken(User user);
}
