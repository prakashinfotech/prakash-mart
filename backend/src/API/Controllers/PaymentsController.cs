using PrakashMart.Application.DTOs.Payments;
using PrakashMart.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PrakashMart.API.Controllers;

[Authorize(Roles = "Customer")]
public class PaymentsController(IPaymentService paymentService) : BaseController
{
    [HttpPost("create-order")]
    public async Task<IActionResult> CreateOrder([FromBody] CreateRazorpayOrderRequest request)
    {
        var result = await paymentService.CreateOrderAsync(request.Amount);
        return Ok(result);
    }

    [HttpPost("verify")]
    public IActionResult VerifyPayment([FromBody] VerifyPaymentRequest request)
    {
        var isValid = paymentService.VerifySignature(
            request.RazorpayOrderId,
            request.RazorpayPaymentId,
            request.RazorpaySignature);

        if (!isValid)
            return BadRequest(new { message = "Payment verification failed. Please contact support." });

        return Ok(new { verified = true });
    }
}
