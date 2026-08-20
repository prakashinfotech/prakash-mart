namespace PrakashMart.Application.DTOs.Reviews;

public record ReviewDto(
    Guid Id,
    Guid ProductId,
    Guid UserId,
    string UserName,
    int Rating,
    string Comment,
    DateTime CreatedAt);
