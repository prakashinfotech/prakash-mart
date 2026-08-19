using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace PrakashMart.Infrastructure.Persistence.Repositories;

public class UserAddressRepository(AppDbContext context) : BaseRepository<UserAddress>(context), IUserAddressRepository
{
    public async Task<IEnumerable<UserAddress>> GetByUserIdAsync(Guid userId)
        => await DbSet.Where(a => a.UserId == userId).OrderByDescending(a => a.IsDefault).ToListAsync();
}
