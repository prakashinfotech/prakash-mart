namespace PrakashMart.Domain.Entities;

public class Banner : BaseEntity
{
    public string Title { get; private set; } = string.Empty;
    public string Subtitle { get; private set; } = string.Empty;
    public string Badge { get; private set; } = string.Empty;
    public string CtaText { get; private set; } = string.Empty;
    public string CtaCategory { get; private set; } = string.Empty;
    public string Gradient { get; private set; } = string.Empty;
    public string Emoji { get; private set; } = string.Empty;
    public int SortOrder { get; private set; }
    public bool IsActive { get; private set; } = true;

    private Banner() { }

    public static Banner Create(string title, string subtitle, string badge, string ctaText,
        string ctaCategory, string gradient, string emoji, int sortOrder)
        => new()
        {
            Title = title, Subtitle = subtitle, Badge = badge, CtaText = ctaText,
            CtaCategory = ctaCategory, Gradient = gradient, Emoji = emoji, SortOrder = sortOrder
        };

    public void Update(string title, string subtitle, string badge, string ctaText,
        string ctaCategory, string gradient, string emoji, int sortOrder)
    {
        Title = title; Subtitle = subtitle; Badge = badge; CtaText = ctaText;
        CtaCategory = ctaCategory; Gradient = gradient; Emoji = emoji; SortOrder = sortOrder;
        SetUpdated();
    }

    public void SetActive(bool value) { IsActive = value; SetUpdated(); }
}
