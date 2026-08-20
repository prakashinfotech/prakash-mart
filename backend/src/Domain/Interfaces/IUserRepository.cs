using PrakashMart.Domain.Entities;

namespace PrakashMart.Domain.Interfaces;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email);
    Task<bool> EmailExistsAsync(string email);
    Task<User?> GetByPasswordResetTokenAsync(string token);
    new Task<IEnumerable<User>> GetAllAsync();
}
