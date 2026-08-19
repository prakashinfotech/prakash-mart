namespace PrakashMart.Domain.Entities;

public class CategoryVariantType
{
    public Guid CategoryId { get; private set; }
    public Guid VariantTypeId { get; private set; }
    public int DisplayOrder { get; private set; }
    public bool IsRequired { get; private set; }

    public Category? Category { get; private set; }
    public VariantType? VariantType { get; private set; }

    private CategoryVariantType() { }

    public static CategoryVariantType Create(Guid categoryId, Guid variantTypeId, int displayOrder, bool isRequired)
        => new() { CategoryId = categoryId, VariantTypeId = variantTypeId, DisplayOrder = displayOrder, IsRequired = isRequired };

    public void UpdateOrder(int displayOrder) { DisplayOrder = displayOrder; }
}
