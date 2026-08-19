namespace PrakashMart.Domain.Entities;

public class Brand : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public Guid? CategoryId { get; private set; }
    public Category? Category { get; private set; }
    public ICollection<Product> Products { get; private set; } = [];

    private Brand() { }

    public static Brand Create(string name, Guid? categoryId = null, string? description = null)
        => new() { Name = name, CategoryId = categoryId, Description = description };

    public void Update(string name, Guid? categoryId, string? description = null)
    {
        Name = name; CategoryId = categoryId; Description = description; SetUpdated();
    }
}
