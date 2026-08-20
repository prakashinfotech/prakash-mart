using PrakashMart.Application.DTOs.Admin;
using PrakashMart.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PrakashMart.API.Controllers;

[Authorize(Roles = "Admin")]
public class AdminController(IAdminService adminService) : BaseController
{
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var result = await adminService.GetStatsAsync();
        return Ok(result);
    }

    [HttpGet("sellers")]
    public async Task<IActionResult> GetSellers()
    {
        var result = await adminService.GetSellersAsync();
        return Ok(result);
    }

    [HttpPost("sellers")]
    public async Task<IActionResult> CreateSeller([FromBody] CreateSellerDto dto)
    {
        var result = await adminService.CreateSellerAsync(dto);
        return Created($"/admin/sellers/{result.Id}", result);
    }

    [HttpPatch("sellers/{id:guid}/toggle")]
    public async Task<IActionResult> ToggleSeller(Guid id)
    {
        var result = await adminService.ToggleSellerActiveAsync(id);
        return Ok(result);
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var result = await adminService.GetAllUsersAsync();
        return Ok(result);
    }

    [HttpPatch("users/{id:guid}/toggle")]
    public async Task<IActionResult> ToggleUser(Guid id)
    {
        var result = await adminService.ToggleUserActiveAsync(id);
        return Ok(result);
    }

    [HttpPatch("products/{id:guid}/toggle")]
    public async Task<IActionResult> ToggleProduct(Guid id)
    {
        var result = await adminService.ToggleProductActiveAsync(id);
        return Ok(result);
    }
}
