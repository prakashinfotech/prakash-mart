namespace PrakashMart.Application.DTOs.Payments;

public record CreateRazorpayOrderRequest(decimal Amount);

public record CreateRazorpayOrderResponse(
    string RazorpayOrderId,
    long Amount,
    string Currency,
    string KeyId);

public record VerifyPaymentRequest(
    string RazorpayOrderId,
    string RazorpayPaymentId,
    string RazorpaySignature);
