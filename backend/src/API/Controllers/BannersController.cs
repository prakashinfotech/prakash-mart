using PrakashMart.Application.DTOs.Banners;
using PrakashMart.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PrakashMart.API.Controllers;

public class BannersController(IBannerService bannerService) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetActive()
    {
        var result = await bannerService.GetActiveAsync();
        return Ok(result);
    }

    [HttpGet("all")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
    {
        var result = await bannerService.GetAllAsync();
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateBannerDto dto)
    {
        var result = await bannerService.CreateAsync(dto);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBannerDto dto)
    {
        var result = await bannerService.UpdateAsync(id, dto);
        return Ok(result);
    }

    [HttpPatch("{id:guid}/toggle")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Toggle(Guid id)
    {
        await bannerService.ToggleActiveAsync(id);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await bannerService.DeleteAsync(id);
        return NoContent();
    }
}
