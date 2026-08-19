using PrakashMart.Application.Common.Exceptions;
using PrakashMart.Application.DTOs.Addresses;
using PrakashMart.Application.Interfaces;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;

namespace PrakashMart.Application.Services;

public class AddressService(IUserAddressRepository addressRepository, IUnitOfWork unitOfWork) : IAddressService
{
    public async Task<IEnumerable<AddressDto>> GetMyAddressesAsync(Guid userId)
    {
        var addresses = await addressRepository.GetByUserIdAsync(userId);
        return addresses.Select(Map);
    }

    public async Task<AddressDto> AddAsync(Guid userId, CreateAddressDto dto)
    {
        var existing = await addressRepository.GetByUserIdAsync(userId);
        var isFirst = !existing.Any();

        var address = UserAddress.Create(userId, dto.Label, dto.FullName, dto.Phone,
            dto.AddressLine, dto.City, dto.State, dto.PostalCode);

        if (isFirst) address.SetDefault(true);

        await addressRepository.AddAsync(address);
        await unitOfWork.SaveChangesAsync();
        return Map(address);
    }

    public async Task DeleteAsync(Guid userId, Guid addressId)
    {
        var address = await addressRepository.GetByIdAsync(addressId)
            ?? throw new NotFoundException("Address not found.");
        if (address.UserId != userId) throw new ForbiddenException("Access denied.");
        addressRepository.Delete(address);
        await unitOfWork.SaveChangesAsync();
    }

    public async Task SetDefaultAsync(Guid userId, Guid addressId)
    {
        var addresses = (await addressRepository.GetByUserIdAsync(userId)).ToList();
        foreach (var a in addresses) a.SetDefault(a.Id == addressId);
        await unitOfWork.SaveChangesAsync();
    }

    private static AddressDto Map(UserAddress a) =>
        new(a.Id, a.Label, a.FullName, a.Phone, a.AddressLine, a.City, a.State, a.PostalCode, a.IsDefault);
}
