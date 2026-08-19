using PrakashMart.Application.Interfaces;
using PrakashMart.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Text.Json;
using WebPush;

namespace PrakashMart.Infrastructure.Services;

public class PushNotificationService(
    IPushSubscriptionRepository repository,
    IConfiguration configuration) : IPushNotificationService
{
    private readonly string _publicKey = configuration["WebPush:VapidPublicKey"]!;
    private readonly string _privateKey = configuration["WebPush:VapidPrivateKey"]!;
    private readonly string _subject = configuration["WebPush:Subject"] ?? "mailto:admin@example.com";

    public async Task SendToUserAsync(Guid userId, string title, string body, string url)
    {
        var subscriptions = await repository.GetByUserIdAsync(userId);
        var client = new WebPushClient();
        client.SetVapidDetails(_subject, _publicKey, _privateKey);

        var payload = JsonSerializer.Serialize(new { title, body, url });
        var staleEndpoints = new List<string>();

        foreach (var sub in subscriptions)
        {
            try
            {
                var webSub = new WebPush.PushSubscription(sub.Endpoint, sub.P256DH, sub.Auth);
                await client.SendNotificationAsync(webSub, payload);
            }
            catch (WebPushException ex) when ((int)ex.StatusCode is 404 or 410)
            {
                // Subscription expired or unregistered — remove it
                staleEndpoints.Add(sub.Endpoint);
            }
            catch { /* non-critical — swallow transient delivery errors */ }
        }

        foreach (var endpoint in staleEndpoints)
            await repository.DeleteByEndpointAsync(endpoint);
    }
}
