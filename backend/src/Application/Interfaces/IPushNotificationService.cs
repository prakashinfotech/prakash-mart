namespace PrakashMart.Application.Interfaces;

public interface IPushNotificationService
{
    Task SendToUserAsync(Guid userId, string title, string body, string url);
}
