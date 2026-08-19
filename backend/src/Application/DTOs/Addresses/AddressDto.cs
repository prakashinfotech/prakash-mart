namespace PrakashMart.Application.DTOs.Addresses;

public record AddressDto(Guid Id, string Label, string FullName, string Phone,
    string AddressLine, string City, string State, string PostalCode, bool IsDefault);

public record CreateAddressDto(string Label, string FullName, string Phone,
    string AddressLine, string City, string State, string PostalCode);
