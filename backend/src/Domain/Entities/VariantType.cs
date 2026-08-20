namespace PrakashMart.Domain.Entities;

public class VariantType : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public string DisplayType { get; private set; } = "text"; // "select" | "text" | "color"
    public string SuggestedOptions { get; private set; } = "[]"; // JSON array of strings
    public bool IsActive { get; private set; } = true;

    public ICollection<CategoryVariantType> CategoryVariantTypes { get; private set; } = [];

    private VariantType() { }

    public static VariantType Create(string name, string displayType, string suggestedOptions)
        => new() { Name = name, DisplayType = displayType, SuggestedOptions = suggestedOptions };

    public void Update(string name, string displayType, string suggestedOptions)
    {
        Name = name; DisplayType = displayType; SuggestedOptions = suggestedOptions; SetUpdated();
    }

    public void SetActive(bool active) { IsActive = active; SetUpdated(); }
}
