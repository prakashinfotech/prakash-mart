using PrakashMart.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PrakashMart.API.Controllers;

[Route("api/inventory/forecast")]
public class InventoryForecastController(IInventoryForecastService forecastService) : BaseController
{
    // Seller: forecast for their own products
    [HttpGet]
    [Authorize(Roles = "Seller,Admin")]
    public async Task<IActionResult> GetSellerForecast()
    {
        var result = await forecastService.GetSellerForecastAsync(CurrentUserId);
        return Ok(result);
    }

    // Admin: platform-wide forecast summary
    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAdminForecast()
    {
        var result = await forecastService.GetAdminForecastAsync();
        return Ok(result);
    }
}
