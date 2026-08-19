namespace PrakashMart.Domain.Entities;

public class UserAddress : BaseEntity
{
    public Guid UserId { get; private set; }
    public string Label { get; private set; } = string.Empty;
    public string FullName { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string AddressLine { get; private set; } = string.Empty;
    public string City { get; private set; } = string.Empty;
    public string State { get; private set; } = string.Empty;
    public string PostalCode { get; private set; } = string.Empty;
    public bool IsDefault { get; private set; }

    private UserAddress() { }

    public static UserAddress Create(Guid userId, string label, string fullName, string phone,
        string addressLine, string city, string state, string postalCode) => new()
    {
        UserId = userId, Label = label, FullName = fullName, Phone = phone,
        AddressLine = addressLine, City = city, State = state, PostalCode = postalCode,
    };

    public void SetDefault(bool value) { IsDefault = value; SetUpdated(); }
}
