using PrakashMart.Application.DTOs.Variants;
using PrakashMart.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PrakashMart.API.Controllers;

[Route("api/products/{productId:guid}/variants")]
public class ProductVariantsController(IProductVariantService variantService) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetByProduct(Guid productId)
    {
        var result = await variantService.GetByProductAsync(productId);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Seller")]
    public async Task<IActionResult> Create(Guid productId, [FromBody] CreateVariantDto dto)
    {
        var result = await variantService.CreateAsync(productId, dto, CurrentUserId);
        return Ok(result);
    }

    [HttpPut("{variantId:guid}")]
    [Authorize(Roles = "Seller")]
    public async Task<IActionResult> Update(Guid productId, Guid variantId, [FromBody] UpdateVariantDto dto)
    {
        var result = await variantService.UpdateAsync(variantId, dto, CurrentUserId);
        return Ok(result);
    }

    [HttpPatch("{variantId:guid}/toggle")]
    [Authorize(Roles = "Seller")]
    public async Task<IActionResult> Toggle(Guid productId, Guid variantId)
    {
        await variantService.ToggleActiveAsync(variantId, CurrentUserId);
        return NoContent();
    }

    [HttpDelete("{variantId:guid}")]
    [Authorize(Roles = "Seller")]
    public async Task<IActionResult> Delete(Guid productId, Guid variantId)
    {
        await variantService.DeleteAsync(variantId, CurrentUserId);
        return NoContent();
    }
}
