using PrakashMart.Application.DTOs.Orders;

namespace PrakashMart.Application.Interfaces;

public interface IEmailService
{
    Task SendOrderConfirmationAsync(string toEmail, string toName, OrderDto order);
    Task SendOrderStatusUpdateAsync(string toEmail, string toName, OrderDto order);
    Task SendOrderCancelledAsync(string toEmail, string toName, OrderDto order, decimal walletCredited);
    Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetUrl);
    Task SendWelcomeEmailAsync(string toEmail, string toName);
}
