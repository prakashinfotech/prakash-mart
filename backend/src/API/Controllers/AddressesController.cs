using PrakashMart.Application.DTOs.Addresses;
using PrakashMart.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PrakashMart.API.Controllers;

[Authorize]
public class AddressesController(IAddressService addressService) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await addressService.GetMyAddressesAsync(CurrentUserId);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] CreateAddressDto dto)
    {
        var result = await addressService.AddAsync(CurrentUserId, dto);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await addressService.DeleteAsync(CurrentUserId, id);
        return NoContent();
    }

    [HttpPatch("{id:guid}/default")]
    public async Task<IActionResult> SetDefault(Guid id)
    {
        await addressService.SetDefaultAsync(CurrentUserId, id);
        return NoContent();
    }
}
