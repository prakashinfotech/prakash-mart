using PrakashMart.Application.DTOs.Variants;
using PrakashMart.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PrakashMart.API.Controllers;

[Route("api/variant-types")]
public class VariantTypesController(IVariantTypeService variantTypeService) : BaseController
{
    // Public: seller/customer uses this to get variant types for a category
    [HttpGet("by-category/{categoryId:guid}")]
    public async Task<IActionResult> GetByCategory(Guid categoryId)
    {
        var result = await variantTypeService.GetByCategoryAsync(categoryId);
        return Ok(result);
    }

    // Admin only below
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
    {
        var result = await variantTypeService.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await variantTypeService.GetByIdAsync(id);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateVariantTypeDto dto)
    {
        var result = await variantTypeService.CreateAsync(dto);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateVariantTypeDto dto)
    {
        var result = await variantTypeService.UpdateAsync(id, dto);
        return Ok(result);
    }

    [HttpPatch("{id:guid}/toggle")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Toggle(Guid id)
    {
        await variantTypeService.ToggleActiveAsync(id);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await variantTypeService.DeleteAsync(id);
        return NoContent();
    }
}
