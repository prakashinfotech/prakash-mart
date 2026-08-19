using PrakashMart.Application.DTOs.Products;
using PrakashMart.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PrakashMart.API.Controllers;

public class ProductsController(IProductService productService) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetFiltered([FromQuery] ProductFilterDto filter)
    {
        var result = await productService.GetFilteredAsync(filter);
        return Ok(result);
    }

    [HttpGet("variant-options")]
    public async Task<IActionResult> GetVariantOptions()
    {
        var result = await productService.GetVariantOptionsAsync();
        return Ok(result);
    }

    [HttpGet("suggestions")]
    public async Task<IActionResult> GetSuggestions([FromQuery] string q = "", [FromQuery] int limit = 8)
    {
        var result = await productService.GetSuggestionsAsync(q, Math.Clamp(limit, 1, 20));
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await productService.GetByIdAsync(id);
        return Ok(result);
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var result = await productService.GetBySlugAsync(slug);
        return Ok(result);
    }

    [Authorize(Roles = "Seller,Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
    {
        var result = await productService.CreateAsync(dto, CurrentUserId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [Authorize(Roles = "Seller,Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProductDto dto)
    {
        var result = await productService.UpdateAsync(id, dto, CurrentUserId);
        return Ok(result);
    }

    [Authorize(Roles = "Seller,Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await productService.DeleteAsync(id, CurrentUserId);
        return NoContent();
    }
}
