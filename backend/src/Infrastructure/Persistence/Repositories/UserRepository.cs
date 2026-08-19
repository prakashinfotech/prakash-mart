using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace PrakashMart.Infrastructure.Persistence.Repositories;

public class UserRepository(AppDbContext context) : BaseRepository<User>(context), IUserRepository
{
    public async Task<User?> GetByEmailAsync(string email)
        => await DbSet.FirstOrDefaultAsync(u => u.Email == email);

    public async Task<bool> EmailExistsAsync(string email)
        => await DbSet.AnyAsync(u => u.Email == email);

    public async Task<User?> GetByPasswordResetTokenAsync(string token)
        => await DbSet.FirstOrDefaultAsync(u => u.PasswordResetToken == token);

    public new async Task<IEnumerable<User>> GetAllAsync()
        => await DbSet.OrderBy(u => u.Name).ToListAsync();
}
