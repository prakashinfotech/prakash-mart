using System.Net;
using System.Net.Mail;
using PrakashMart.Application.DTOs.Orders;
using PrakashMart.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace PrakashMart.Infrastructure.Services;

public class EmailService(IConfiguration config, ILogger<EmailService> logger) : IEmailService
{
    private readonly string _host = config["Smtp:Host"] ?? string.Empty;
    private readonly int _port = int.TryParse(config["Smtp:Port"], out var p) ? p : 587;
    private readonly bool _enableSsl = bool.TryParse(config["Smtp:EnableSsl"], out var s) && s;
    private readonly string _username = config["Smtp:Username"] ?? string.Empty;
    private readonly string _password = config["Smtp:Password"] ?? string.Empty;
    private readonly string _fromEmail = config["Smtp:FromEmail"] ?? string.Empty;
    private readonly string _fromName = config["Smtp:FromName"] ?? "PrakashMart";

    public async Task SendOrderConfirmationAsync(string toEmail, string toName, OrderDto order)
    {
        await SendAsync(
            toEmail, toName,
            $"Order Confirmed — #{order.Id.ToString()[..8].ToUpper()}",
            EmailTemplates.OrderConfirmation(toName, order));
    }

    public async Task SendOrderStatusUpdateAsync(string toEmail, string toName, OrderDto order)
    {
        await SendAsync(
            toEmail, toName,
            $"Order Update: {order.Status} — #{order.Id.ToString()[..8].ToUpper()}",
            EmailTemplates.OrderStatusUpdate(toName, order));
    }

    public async Task SendOrderCancelledAsync(string toEmail, string toName, OrderDto order, decimal walletCredited)
    {
        await SendAsync(toEmail, toName,
            $"Order Cancelled — #{order.Id.ToString()[..8].ToUpper()}",
            EmailTemplates.OrderCancelled(toName, order, walletCredited));
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetUrl)
    {
        await SendAsync(toEmail, toName, "Reset your PrakashMart password",
            EmailTemplates.PasswordReset(toName, resetUrl));
    }

    public async Task SendWelcomeEmailAsync(string toEmail, string toName)
    {
        await SendAsync(toEmail, toName, $"Welcome to PrakashMart, {toName}! 🎉",
            EmailTemplates.Welcome(toName));
    }

    private async Task SendAsync(string toEmail, string toName, string subject, string html)
    {
        if (string.IsNullOrWhiteSpace(_host) || string.IsNullOrWhiteSpace(_username))
        {
            logger.LogWarning("SMTP is not configured — email skipped.");
            return;
        }

        try
        {
            using var message = new MailMessage
            {
                From = new MailAddress(_fromEmail, _fromName),
                Subject = subject,
                Body = html,
                IsBodyHtml = true
            };
            message.To.Add(new MailAddress(toEmail, toName));

            using var client = new SmtpClient(_host, _port)
            {
                EnableSsl = _enableSsl,
                Credentials = new NetworkCredential(_username, _password),
                DeliveryMethod = SmtpDeliveryMethod.Network
            };

            await client.SendMailAsync(message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email to {Email}", toEmail);
        }
    }
}
