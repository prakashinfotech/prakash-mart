using PrakashMart.Application.DTOs.Push;
using PrakashMart.Application.Interfaces;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace PrakashMart.API.Controllers;

[Route("api/push")]
public class PushSubscriptionController(
    IPushSubscriptionRepository repository,
    IConfiguration configuration) : BaseController
{
    [HttpGet("vapid-public-key")]
    [AllowAnonymous]
    public IActionResult GetVapidPublicKey()
        => Ok(new { key = configuration["WebPush:VapidPublicKey"] });

    [Authorize(Roles = "Customer")]
    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe([FromBody] SubscribeDto dto)
    {
        // Remove stale subscription for this endpoint (browser may re-subscribe)
        await repository.DeleteByEndpointAsync(dto.Endpoint);
        await repository.AddAsync(PushSubscription.Create(CurrentUserId, dto.Endpoint, dto.P256DH, dto.Auth));
        await repository.SaveChangesAsync();
        return Ok();
    }

    [Authorize(Roles = "Customer")]
    [HttpDelete("unsubscribe")]
    public async Task<IActionResult> Unsubscribe([FromBody] UnsubscribeDto dto)
    {
        await repository.DeleteByEndpointAsync(dto.Endpoint);
        return Ok();
    }

    [Authorize(Roles = "Customer")]
    [HttpPost("test")]
    public async Task<IActionResult> SendTestPush([FromServices] IPushNotificationService pushService)
    {
        var subs = await repository.GetByUserIdAsync(CurrentUserId);
        var count = subs.Count();
        if (count == 0)
            return BadRequest(new { error = "No push subscriptions found for this user. Make sure you granted notification permission." });

        await pushService.SendToUserAsync(CurrentUserId, "Test Notification", $"Push is working! ({count} device(s) registered)", "/orders");
        return Ok(new { message = $"Test push sent to {count} subscription(s)." });
    }
}
