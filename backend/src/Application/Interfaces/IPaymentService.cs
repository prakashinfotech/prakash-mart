using PrakashMart.Application.DTOs.Payments;

namespace PrakashMart.Application.Interfaces;

public interface IPaymentService
{
    Task<CreateRazorpayOrderResponse> CreateOrderAsync(decimal amountInRupees);
    bool VerifySignature(string razorpayOrderId, string razorpayPaymentId, string signature);
}
