namespace PrakashMart.Application.Interfaces;

public interface IInvoiceService
{
    Task<byte[]> GenerateOrderInvoicePdfAsync(Guid orderId, Guid currentUserId, bool isAdmin);
}
