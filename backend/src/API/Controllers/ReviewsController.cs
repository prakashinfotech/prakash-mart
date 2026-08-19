using PrakashMart.Application.DTOs.Reviews;
using PrakashMart.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PrakashMart.API.Controllers;

public class ReviewsController(IReviewService reviewService) : BaseController
{
    [HttpGet("product/{productId:guid}")]
    public async Task<IActionResult> GetByProduct(Guid productId)
    {
        var result = await reviewService.GetByProductAsync(productId);
        return Ok(result);
    }

    [Authorize]
    [HttpGet("{productId:guid}/can-review")]
    public async Task<IActionResult> CanReview(Guid productId)
    {
        var result = await reviewService.CanReviewAsync(CurrentUserId, productId);
        return Ok(result);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReviewDto dto)
    {
        var result = await reviewService.CreateAsync(CurrentUserId, dto);
        return Ok(result);
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await reviewService.DeleteAsync(id, CurrentUserId);
        return NoContent();
    }
}
