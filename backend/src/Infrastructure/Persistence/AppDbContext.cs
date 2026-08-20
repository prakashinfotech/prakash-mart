using PrakashMart.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace PrakashMart.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<UserAddress> UserAddresses => Set<UserAddress>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<Banner> Banners => Set<Banner>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<VariantType> VariantTypes => Set<VariantType>();
    public DbSet<CategoryVariantType> CategoryVariantTypes => Set<CategoryVariantType>();
    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>();
    public DbSet<OrderReturn> OrderReturns => Set<OrderReturn>();
    public DbSet<InventoryTransaction> InventoryTransactions => Set<InventoryTransaction>();
    public DbSet<CartReservation> CartReservations => Set<CartReservation>();
    public DbSet<PushSubscription> PushSubscriptions => Set<PushSubscription>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Order>().Property(o => o.TotalAmount).HasPrecision(18, 2);
        modelBuilder.Entity<Order>().Property(o => o.DiscountAmount).HasPrecision(18, 2);
        modelBuilder.Entity<Order>().Property(o => o.WalletAmountUsed).HasPrecision(18, 2);
        modelBuilder.Entity<ProductVariant>().Property(v => v.PriceOverride).HasPrecision(18, 2);
        modelBuilder.Entity<ProductVariant>().Property(v => v.RowVersion).IsRowVersion();
        modelBuilder.Entity<ProductVariant>().Property(v => v.SKU).HasMaxLength(100).IsRequired();
        modelBuilder.Entity<ProductVariant>().Property(v => v.Barcode).HasMaxLength(100);
        modelBuilder.Entity<ProductVariant>()
            .HasIndex(v => v.SKU)
            .IsUnique()
            .HasDatabaseName("UX_ProductVariants_SKU");
        modelBuilder.Entity<Wallet>().Property(w => w.Balance).HasPrecision(18, 2);
        modelBuilder.Entity<WalletTransaction>().Property(t => t.Amount).HasPrecision(18, 2);
        // CategoryVariantType composite PK
        modelBuilder.Entity<CategoryVariantType>()
            .HasKey(cvt => new { cvt.CategoryId, cvt.VariantTypeId });

        modelBuilder.Entity<CategoryVariantType>()
            .HasOne(cvt => cvt.Category)
            .WithMany(c => c.CategoryVariantTypes)
            .HasForeignKey(cvt => cvt.CategoryId);

        modelBuilder.Entity<CategoryVariantType>()
            .HasOne(cvt => cvt.VariantType)
            .WithMany(vt => vt.CategoryVariantTypes)
            .HasForeignKey(cvt => cvt.VariantTypeId);

        modelBuilder.Entity<InventoryTransaction>()
            .HasOne(t => t.Variant)
            .WithMany()
            .HasForeignKey(t => t.ProductVariantId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<InventoryTransaction>()
            .HasIndex(t => t.ProductVariantId)
            .HasDatabaseName("IX_InventoryTransactions_VariantId");
        modelBuilder.Entity<InventoryTransaction>()
            .HasIndex(t => t.ReferenceId)
            .HasDatabaseName("IX_InventoryTransactions_ReferenceId");

        modelBuilder.Entity<CartReservation>()
            .HasOne(r => r.Variant)
            .WithMany()
            .HasForeignKey(r => r.ProductVariantId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<CartReservation>()
            .HasIndex(r => r.UserId)
            .HasDatabaseName("IX_CartReservations_UserId");
        modelBuilder.Entity<CartReservation>()
            .HasIndex(r => new { r.IsReleased, r.ExpiresAt })
            .HasDatabaseName("IX_CartReservations_IsReleased_ExpiresAt");

        modelBuilder.Entity<PushSubscription>()
            .HasIndex(s => s.UserId)
            .HasDatabaseName("IX_PushSubscriptions_UserId");
        modelBuilder.Entity<PushSubscription>()
            .Property(s => s.Endpoint).HasMaxLength(2048).IsRequired();
        modelBuilder.Entity<PushSubscription>()
            .Property(s => s.P256DH).HasMaxLength(512).IsRequired();
        modelBuilder.Entity<PushSubscription>()
            .Property(s => s.Auth).HasMaxLength(256).IsRequired();

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
