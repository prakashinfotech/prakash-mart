using PrakashMart.Application.DTOs.Cart;
using PrakashMart.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PrakashMart.API.Controllers;

[Authorize]
public class CartController(ICartService cartService) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetCart()
    {
        var result = await cartService.GetCartAsync(CurrentUserId);
        return Ok(result);
    }

    [HttpPost("items")]
    public async Task<IActionResult> AddItem([FromBody] AddToCartDto dto)
    {
        var result = await cartService.AddItemAsync(CurrentUserId, dto);
        return Ok(result);
    }

    [HttpPut("items/{itemId:guid}")]
    public async Task<IActionResult> UpdateItem(Guid itemId, [FromBody] int quantity)
    {
        var result = await cartService.UpdateItemAsync(CurrentUserId, itemId, quantity);
        return Ok(result);
    }

    [HttpDelete("items/{itemId:guid}")]
    public async Task<IActionResult> RemoveItem(Guid itemId)
    {
        var result = await cartService.RemoveItemAsync(CurrentUserId, itemId);
        return Ok(result);
    }

    [HttpDelete]
    public async Task<IActionResult> ClearCart()
    {
        await cartService.ClearCartAsync(CurrentUserId);
        return NoContent();
    }
}
