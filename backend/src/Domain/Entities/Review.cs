namespace PrakashMart.Domain.Entities;

public class Review : BaseEntity
{
    public Guid ProductId { get; private set; }
    public Guid UserId { get; private set; }
    public int Rating { get; private set; }
    public string Comment { get; private set; } = string.Empty;
    public User? User { get; private set; }

    private Review() { }

    public static Review Create(Guid productId, Guid userId, int rating, string comment)
        => new() { ProductId = productId, UserId = userId, Rating = rating, Comment = comment };
}
