using PrakashMart.Application.DTOs.Coupons;
using PrakashMart.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PrakashMart.API.Controllers;

public class CouponsController(ICouponService couponService) : BaseController
{
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
    {
        var result = await couponService.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("validate")]
    [Authorize]
    public async Task<IActionResult> Validate([FromQuery] string code, [FromQuery] decimal cartTotal)
    {
        var result = await couponService.ValidateAsync(code, cartTotal);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateCouponDto dto)
    {
        var result = await couponService.CreateAsync(dto);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await couponService.DeleteAsync(id);
        return NoContent();
    }
}
