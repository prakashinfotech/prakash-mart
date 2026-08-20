namespace PrakashMart.Domain.Entities;

public class Category : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public ICollection<Product> Products { get; private set; } = [];
    public ICollection<CategoryVariantType> CategoryVariantTypes { get; private set; } = [];

    private Category() { }

    public static Category Create(string name) => new() { Name = name };
}
