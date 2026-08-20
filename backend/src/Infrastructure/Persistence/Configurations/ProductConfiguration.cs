using System.Text.Json;
using PrakashMart.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace PrakashMart.Infrastructure.Persistence.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    private static readonly JsonSerializerOptions _json = new();

    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Name).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Description).IsRequired().HasMaxLength(2000);
        builder.Property(p => p.Price).HasPrecision(18, 2);
        builder.Property(p => p.DiscountPercent).HasPrecision(5, 2);
        builder.Property(p => p.ImageUrl).IsRequired().HasMaxLength(500);
        builder.Property(p => p.Rating).HasPrecision(3, 2);

        var listComparer = new ValueComparer<List<string>>(
            (a, b) => a != null && b != null ? a.SequenceEqual(b) : a == b,
            c => c.Aggregate(0, (h, s) => HashCode.Combine(h, s.GetHashCode())),
            c => c.ToList());

        builder.Property(p => p.ImageUrls)
            .HasConversion(
                v => JsonSerializer.Serialize(v, _json),
                v => string.IsNullOrWhiteSpace(v) ? new List<string>() : JsonSerializer.Deserialize<List<string>>(v, _json) ?? new List<string>())
            .HasColumnType("nvarchar(max)")
            .Metadata.SetValueComparer(listComparer);

        builder.Property(p => p.Offers)
            .HasConversion(
                v => JsonSerializer.Serialize(v, _json),
                v => string.IsNullOrWhiteSpace(v) ? new List<string>() : JsonSerializer.Deserialize<List<string>>(v, _json) ?? new List<string>())
            .HasColumnType("nvarchar(max)")
            .Metadata.SetValueComparer(listComparer);

        builder.Property(p => p.Slug).IsRequired().HasMaxLength(300);
        builder.HasIndex(p => p.Slug).IsUnique().HasFilter("[Slug] <> N''");

        builder.Property(p => p.Warranty).HasMaxLength(200);
        builder.Property(p => p.CountryOfOrigin).HasMaxLength(100);
        builder.Property(p => p.DispatchInfo).HasMaxLength(200);
        builder.Property(p => p.ShipsFrom).HasMaxLength(100);

        builder.HasOne(p => p.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Brand)
            .WithMany(b => b.Products)
            .HasForeignKey(p => p.BrandId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Seller)
            .WithMany()
            .HasForeignKey(p => p.SellerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
