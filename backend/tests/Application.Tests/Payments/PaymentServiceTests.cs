using System.Security.Cryptography;
using System.Text;
using PrakashMart.Infrastructure.Services;
using FluentAssertions;
using Microsoft.Extensions.Configuration;

namespace Application.Tests.Payments;

public class PaymentServiceTests
{
    private const string TestKeyId = "rzp_test_key";
    private const string TestKeySecret = "test_secret_123";

    private static PaymentService BuildSut() =>
        new(new HttpClient(), BuildConfig());

    private static IConfiguration BuildConfig() =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Razorpay:KeyId"]     = TestKeyId,
                ["Razorpay:KeySecret"] = TestKeySecret
            })
            .Build();

    private static string ComputeSignature(string razorpayOrderId, string paymentId, string secret)
    {
        var message = $"{razorpayOrderId}|{paymentId}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        return Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(message))).ToLowerInvariant();
    }

    // ── VerifySignature ───────────────────────────────────────────────────────

    [Fact]
    public void VerifySignature_ReturnsTrue_WhenSignatureIsValid()
    {
        var sut = BuildSut();
        var orderId   = "order_abc123";
        var paymentId = "pay_xyz789";
        var signature = ComputeSignature(orderId, paymentId, TestKeySecret);

        var result = sut.VerifySignature(orderId, paymentId, signature);

        result.Should().BeTrue();
    }

    [Fact]
    public void VerifySignature_ReturnsFalse_WhenSignatureIsInvalid()
    {
        var sut = BuildSut();

        var result = sut.VerifySignature("order_abc123", "pay_xyz789", "totally_wrong_signature");

        result.Should().BeFalse();
    }

    [Fact]
    public void VerifySignature_ReturnsFalse_WhenPaymentIdIsTampered()
    {
        var sut = BuildSut();
        var orderId           = "order_abc123";
        var realPaymentId     = "pay_xyz789";
        var tamperedPaymentId = "pay_TAMPERED";
        var signature = ComputeSignature(orderId, realPaymentId, TestKeySecret);

        var result = sut.VerifySignature(orderId, tamperedPaymentId, signature);

        result.Should().BeFalse();
    }

    [Fact]
    public void VerifySignature_ReturnsFalse_WhenOrderIdIsTampered()
    {
        var sut = BuildSut();
        var realOrderId     = "order_abc123";
        var tamperedOrderId = "order_TAMPERED";
        var paymentId = "pay_xyz789";
        var signature = ComputeSignature(realOrderId, paymentId, TestKeySecret);

        var result = sut.VerifySignature(tamperedOrderId, paymentId, signature);

        result.Should().BeFalse();
    }

    [Fact]
    public void VerifySignature_ReturnsFalse_WhenSignatureIsEmpty()
    {
        var sut = BuildSut();

        var result = sut.VerifySignature("order_abc123", "pay_xyz789", string.Empty);

        result.Should().BeFalse();
    }
}
