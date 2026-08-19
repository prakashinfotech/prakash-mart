using PrakashMart.Domain.Entities;

namespace PrakashMart.Domain.Interfaces;

public interface IUserAddressRepository : IRepository<UserAddress>
{
    Task<IEnumerable<UserAddress>> GetByUserIdAsync(Guid userId);
}
