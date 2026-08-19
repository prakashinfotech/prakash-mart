using PrakashMart.Domain.Enums;

namespace PrakashMart.Domain.Entities;

public class OrderReturn : BaseEntity
{
    public Guid OrderId { get; private set; }
    public Guid UserId { get; private set; }
    public string Reason { get; private set; } = string.Empty;
    public ReturnStatus Status { get; private set; } = ReturnStatus.Pending;
    public Order? Order { get; private set; }

    private OrderReturn() { }

    public static OrderReturn Create(Guid orderId, Guid userId, string reason)
        => new() { OrderId = orderId, UserId = userId, Reason = reason };

    public void Approve() { Status = ReturnStatus.Approved; SetUpdated(); }
    public void Reject() { Status = ReturnStatus.Rejected; SetUpdated(); }
}
