namespace PrakashMart.Application.DTOs.Reviews;

public record CreateReviewDto(Guid ProductId, int Rating, string Comment);
