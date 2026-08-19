using PrakashMart.Application.DTOs.Returns;
using PrakashMart.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PrakashMart.API.Controllers;

[Authorize(Roles = "Seller,Admin")]
public class SellerController(ISellerAnalyticsService analyticsService, IOrderReturnService returnService) : BaseController
{
    [HttpGet("analytics")]
    public async Task<IActionResult> GetAnalytics()
    {
        var result = await analyticsService.GetAnalyticsAsync(CurrentUserId);
        return Ok(result);
    }

    [HttpGet("orders")]
    public async Task<IActionResult> GetSellerOrders()
    {
        var result = await analyticsService.GetSellerOrdersAsync(CurrentUserId);
        return Ok(result);
    }

    [HttpGet("returns")]
    public async Task<IActionResult> GetReturns()
    {
        var result = await returnService.GetSellerReturnsAsync(CurrentUserId);
        return Ok(result);
    }

    [HttpPatch("returns/{returnId:guid}")]
    public async Task<IActionResult> ProcessReturn(Guid returnId, [FromBody] ProcessReturnDto dto)
    {
        var result = await returnService.ProcessReturnAsync(returnId, CurrentUserId, dto);
        return Ok(result);
    }
}
