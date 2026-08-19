using PrakashMart.Application.DTOs.Orders;
using PrakashMart.Application.DTOs.Returns;
using PrakashMart.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PrakashMart.API.Controllers;

[Authorize]
public class OrdersController(IOrderService orderService, IInvoiceService invoiceService, IOrderReturnService returnService) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetMyOrders()
    {
        var result = await orderService.GetUserOrdersAsync(CurrentUserId);
        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("all")]
    public async Task<IActionResult> GetAllOrders()
    {
        var result = await orderService.GetAllOrdersAsync();
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await orderService.GetByIdAsync(id, CurrentUserId);
        return Ok(result);
    }

    [Authorize(Roles = "Customer")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderDto dto)
    {
        var result = await orderService.CreateAsync(CurrentUserId, dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpGet("{id:guid}/invoice")]
    public async Task<IActionResult> DownloadInvoice(Guid id)
    {
        var isAdmin = User.IsInRole("Admin");
        var pdf = await invoiceService.GenerateOrderInvoicePdfAsync(id, CurrentUserId, isAdmin);
        var filename = $"invoice-{id.ToString()[..8].ToUpper()}.pdf";
        return File(pdf, "application/pdf", filename);
    }

    [Authorize(Roles = "Customer")]
    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> CancelOrder(Guid id)
    {
        var result = await orderService.CancelOrderAsync(id, CurrentUserId);
        return Ok(result);
    }

    [Authorize(Roles = "Admin,Seller")]
    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] string status)
    {
        var result = await orderService.UpdateStatusAsync(id, status, CurrentUserId);
        return Ok(result);
    }

    [Authorize(Roles = "Customer")]
    [HttpPost("{id:guid}/return")]
    public async Task<IActionResult> RequestReturn(Guid id, [FromBody] CreateReturnRequestDto dto)
    {
        var result = await returnService.RequestReturnAsync(id, CurrentUserId, dto);
        return Ok(result);
    }

    [HttpGet("{id:guid}/return")]
    public async Task<IActionResult> GetReturn(Guid id)
    {
        var result = await returnService.GetByOrderIdAsync(id, CurrentUserId);
        return Ok(result);
    }
}
