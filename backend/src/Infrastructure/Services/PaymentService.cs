using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using PrakashMart.Application.DTOs.Payments;
using PrakashMart.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace PrakashMart.Infrastructure.Services;

file record RazorpayOrderApiResponse(string Id, long Amount, string Currency);

public class PaymentService : IPaymentService
{
    private readonly HttpClient _httpClient;
    private readonly string _keyId;
    private readonly string _keySecret;

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public PaymentService(HttpClient httpClient, IConfiguration config)
    {
        _keyId = config["Razorpay:KeyId"] ?? throw new InvalidOperationException("Razorpay:KeyId not configured.");
        _keySecret = config["Razorpay:KeySecret"] ?? throw new InvalidOperationException("Razorpay:KeySecret not configured.");

        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_keyId}:{_keySecret}"));
        httpClient.BaseAddress = new Uri("https://api.razorpay.com/v1/");
        httpClient.DefaultRequestHeaders.Authorization = new("Basic", credentials);
        _httpClient = httpClient;
    }

    public async Task<CreateRazorpayOrderResponse> CreateOrderAsync(decimal amountInRupees)
    {
        var amountInPaise = (long)(amountInRupees * 100);
        var payload = new
        {
            amount = amountInPaise,
            currency = "INR",
            receipt = Guid.NewGuid().ToString("N")[..20]
        };

        var response = await _httpClient.PostAsJsonAsync("orders", payload);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<RazorpayOrderApiResponse>(json, _jsonOptions)
            ?? throw new InvalidOperationException("Invalid response from Razorpay.");

        return new CreateRazorpayOrderResponse(result.Id, result.Amount, result.Currency, _keyId);
    }

    public bool VerifySignature(string razorpayOrderId, string razorpayPaymentId, string signature)
    {
        var message = $"{razorpayOrderId}|{razorpayPaymentId}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_keySecret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(message));
        var computed = Convert.ToHexString(hash).ToLowerInvariant();
        return computed == signature;
    }
}
