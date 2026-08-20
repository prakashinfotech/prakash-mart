using PrakashMart.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace PrakashMart.Infrastructure.Persistence.Configurations;

public class CouponConfiguration : IEntityTypeConfiguration<Coupon>
{
    public void Configure(EntityTypeBuilder<Coupon> builder)
    {
        builder.HasIndex(c => c.Code).IsUnique();
        builder.Property(c => c.Code).HasMaxLength(50);
        builder.Property(c => c.DiscountPercent).HasPrecision(5, 2);
    }
}
