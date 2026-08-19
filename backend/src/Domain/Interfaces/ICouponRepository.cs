using PrakashMart.Domain.Entities;

namespace PrakashMart.Domain.Interfaces;

public interface ICouponRepository : IRepository<Coupon>
{
    new Task<IEnumerable<Coupon>> GetAllAsync();
    Task<Coupon?> GetByCodeAsync(string code);
}
