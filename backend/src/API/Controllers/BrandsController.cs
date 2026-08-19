using PrakashMart.Application.DTOs.Brands;
using PrakashMart.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PrakashMart.API.Controllers;

public class BrandsController(IBrandService brandService) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? categoryId)
    {
        var result = categoryId.HasValue
            ? await brandService.GetByCategoryAsync(categoryId.Value)
            : await brandService.GetAllAsync();
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateBrandDto dto)
    {
        var result = await brandService.CreateAsync(dto);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBrandDto dto)
    {
        var result = await brandService.UpdateAsync(id, dto);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await brandService.DeleteAsync(id);
        return NoContent();
    }
}
