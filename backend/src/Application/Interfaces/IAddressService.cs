using PrakashMart.Application.DTOs.Addresses;

namespace PrakashMart.Application.Interfaces;

public interface IAddressService
{
    Task<IEnumerable<AddressDto>> GetMyAddressesAsync(Guid userId);
    Task<AddressDto> AddAsync(Guid userId, CreateAddressDto dto);
    Task DeleteAsync(Guid userId, Guid addressId);
    Task SetDefaultAsync(Guid userId, Guid addressId);
}
