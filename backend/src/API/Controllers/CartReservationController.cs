using PrakashMart.Application.DTOs.Reservations;
using PrakashMart.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PrakashMart.API.Controllers;

[Route("api/cart/reserve")]
[Authorize(Roles = "Customer")]
public class CartReservationController(ICartReservationService reservationService) : BaseController
{
    // Reserve cart items — soft-locks stock for the checkout window
    [HttpPost]
    public async Task<IActionResult> Reserve([FromBody] ReserveCartDto dto)
    {
        var result = await reservationService.ReserveAsync(CurrentUserId, dto);
        return Ok(result);
    }

    // Release the current user's active reservation (called on checkout abandon)
    [HttpDelete]
    public async Task<IActionResult> Release()
    {
        await reservationService.ReleaseAsync(CurrentUserId);
        return Ok(new { message = "Reservation released." });
    }

    // Check whether the current reservation is still valid
    [HttpGet("status")]
    public async Task<IActionResult> Status()
    {
        var result = await reservationService.GetStatusAsync(CurrentUserId);
        return Ok(result);
    }
}
