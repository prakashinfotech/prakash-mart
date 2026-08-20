using PrakashMart.Application.DTOs.Inventory;
using PrakashMart.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PrakashMart.API.Controllers;

[Route("api/inventory")]
public class InventoryController(IInventoryService inventoryService) : BaseController
{
    // Admin: look up history by UUID or SKU (e.g. VAR-1D62B35D)
    [HttpGet("lookup")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Lookup([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest(new { message = "Query is required." });

        if (Guid.TryParse(q.Trim(), out var guid))
        {
            var history = await inventoryService.GetByVariantAsync(guid);
            return Ok(new { variantId = guid, history });
        }
        else
        {
            var (variantId, history) = await inventoryService.GetBySkuAsync(q.Trim());
            return Ok(new { variantId, history });
        }
    }

    // Admin: full history for any variant by UUID
    [HttpGet("variants/{variantId:guid}/history")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetVariantHistory(Guid variantId)
    {
        var result = await inventoryService.GetByVariantAsync(variantId);
        return Ok(result);
    }

    // Admin: full history for a product (all variants)
    [HttpGet("products/{productId:guid}/history")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetProductHistory(Guid productId)
    {
        var result = await inventoryService.GetByProductAsync(productId);
        return Ok(result);
    }

    // Admin: manual stock correction — accepts UUID or SKU
    [HttpPost("variants/{variantId:guid}/adjust")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AdminAdjust(Guid variantId, [FromBody] AdminAdjustDto dto)
    {
        await inventoryService.AdminAdjustAsync(variantId, dto.NewStock, dto.Reason, CurrentUserId);
        return Ok(new { message = "Stock adjusted." });
    }

    // Admin: adjust by SKU
    [HttpPost("by-sku/{sku}/adjust")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AdminAdjustBySku(string sku, [FromBody] AdminAdjustDto dto)
    {
        var (variantId, _) = await inventoryService.GetBySkuAsync(sku);
        await inventoryService.AdminAdjustAsync(variantId, dto.NewStock, dto.Reason, CurrentUserId);
        return Ok(new { message = "Stock adjusted.", variantId });
    }

    // Seller: inventory history for their own products
    [HttpGet("seller/history")]
    [Authorize(Roles = "Seller,Admin")]
    public async Task<IActionResult> GetSellerHistory()
    {
        var result = await inventoryService.GetBySellerAsync(CurrentUserId);
        return Ok(result);
    }
}
