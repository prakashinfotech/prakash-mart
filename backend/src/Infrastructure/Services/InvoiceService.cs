using PrakashMart.Application.Common.Exceptions;
using PrakashMart.Application.DTOs.Orders;
using PrakashMart.Application.Interfaces;
using PrakashMart.Domain.Interfaces;
using iText.IO.Font.Constants;
using iText.Kernel.Colors;
using iText.Kernel.Font;
using iText.Kernel.Geom;
using iText.Kernel.Pdf;
using iText.Layout;
using iText.Layout.Borders;
using iText.Layout.Element;
using iText.Layout.Properties;

namespace PrakashMart.Infrastructure.Services;

public class InvoiceService(IOrderRepository orderRepository, IUserRepository userRepository) : IInvoiceService
{
    private static readonly DeviceRgb PrimaryBlue = new(40, 116, 240);
    private static readonly DeviceRgb LightGray = new(248, 248, 248);
    private static readonly DeviceRgb BorderGray = new(224, 224, 224);
    private static readonly DeviceRgb TextDark = new(33, 33, 33);
    private static readonly DeviceRgb TextMuted = new(135, 135, 135);

    public async Task<byte[]> GenerateOrderInvoicePdfAsync(Guid orderId, Guid currentUserId, bool isAdmin)
    {
        var order = await orderRepository.GetByIdWithItemsAsync(orderId)
            ?? throw new NotFoundException("Order not found.");

        if (!isAdmin && order.UserId != currentUserId)
            throw new ForbiddenException("Access denied.");

        var user = await userRepository.GetByIdAsync(order.UserId);
        var customerName = user?.Name ?? "Customer";
        var customerEmail = user?.Email ?? string.Empty;

        var orderDto = new OrderDto(
            order.Id, order.Status.ToString(), order.ShippingAddress,
            string.Empty, string.Empty, string.Empty,
            order.PaymentMethod, order.TotalAmount,
            order.Items.Select(i => new OrderItemDto(
                i.ProductId, i.ProductName, i.UnitPrice, i.Quantity,
                i.Quantity * i.UnitPrice, i.VariantLabel)),
            order.CreatedAt, order.CouponCode, order.DiscountAmount);

        return BuildPdf(orderDto, customerName, customerEmail);
    }

    private static byte[] BuildPdf(OrderDto order, string customerName, string customerEmail)
    {
        using var stream = new MemoryStream();
        var writer = new PdfWriter(stream);
        var pdf = new PdfDocument(writer);
        var document = new Document(pdf, PageSize.A4);
        document.SetMargins(36, 36, 36, 36);

        var fontBold = PdfFontFactory.CreateFont(StandardFonts.HELVETICA_BOLD);
        var fontNormal = PdfFontFactory.CreateFont(StandardFonts.HELVETICA);

        // ── Header bar ─────────────────────────────────────────────────────────
        var header = new Table(UnitValue.CreatePercentArray([70, 30])).UseAllAvailableWidth();
        header.SetBorder(Border.NO_BORDER);

        var brandCell = new Cell().SetBorder(Border.NO_BORDER)
            .SetBackgroundColor(PrimaryBlue).SetPadding(14);
        brandCell.Add(new Paragraph("PrakashMart")
            .SetFont(fontBold).SetFontSize(20).SetFontColor(ColorConstants.WHITE));
        brandCell.Add(new Paragraph("Tax Invoice / Bill of Supply")
            .SetFont(fontNormal).SetFontSize(9).SetFontColor(ColorConstants.WHITE));
        header.AddCell(brandCell);

        var invoiceInfoCell = new Cell().SetBorder(Border.NO_BORDER)
            .SetBackgroundColor(PrimaryBlue).SetPadding(14).SetTextAlignment(TextAlignment.RIGHT);
        invoiceInfoCell.Add(new Paragraph($"Invoice No: #{order.Id.ToString()[..8].ToUpper()}")
            .SetFont(fontBold).SetFontSize(9).SetFontColor(ColorConstants.WHITE));
        invoiceInfoCell.Add(new Paragraph($"Order Date: {order.CreatedAt:dd MMM yyyy}")
            .SetFont(fontNormal).SetFontSize(9).SetFontColor(ColorConstants.WHITE));
        invoiceInfoCell.Add(new Paragraph($"Invoice Date: {DateTime.Now:dd MMM yyyy}")
            .SetFont(fontNormal).SetFontSize(9).SetFontColor(ColorConstants.WHITE));
        header.AddCell(invoiceInfoCell);

        document.Add(header);
        document.Add(new Paragraph(" ").SetFontSize(6));

        // ── Seller + Shipping Info ──────────────────────────────────────────────
        var infoTable = new Table(UnitValue.CreatePercentArray([50, 50])).UseAllAvailableWidth();
        infoTable.SetBorder(Border.NO_BORDER);

        var sellerCell = new Cell().SetBorder(Border.NO_BORDER)
            .SetBorderRight(new SolidBorder(BorderGray, 1)).SetPaddingRight(12);
        sellerCell.Add(new Paragraph("Sold By").SetFont(fontBold).SetFontSize(9).SetFontColor(TextMuted));
        sellerCell.Add(new Paragraph("PrakashMart Store").SetFont(fontBold).SetFontSize(10).SetFontColor(TextDark));
        sellerCell.Add(new Paragraph("India").SetFont(fontNormal).SetFontSize(9).SetFontColor(TextMuted));
        infoTable.AddCell(sellerCell);

        var addrCell = new Cell().SetBorder(Border.NO_BORDER).SetPaddingLeft(12);
        addrCell.Add(new Paragraph("Shipping Address").SetFont(fontBold).SetFontSize(9).SetFontColor(TextMuted));
        addrCell.Add(new Paragraph(customerName).SetFont(fontBold).SetFontSize(10).SetFontColor(TextDark));
        addrCell.Add(new Paragraph(order.ShippingAddress)
            .SetFont(fontNormal).SetFontSize(9).SetFontColor(TextMuted));
        if (!string.IsNullOrEmpty(customerEmail))
            addrCell.Add(new Paragraph(customerEmail).SetFont(fontNormal).SetFontSize(9).SetFontColor(TextMuted));
        infoTable.AddCell(addrCell);

        document.Add(infoTable);
        document.Add(new Paragraph(" ").SetFontSize(8));

        // ── Items Table ─────────────────────────────────────────────────────────
        var itemsTable = new Table(UnitValue.CreatePercentArray([50, 12, 19, 19])).UseAllAvailableWidth();
        itemsTable.SetBorder(Border.NO_BORDER);

        void AddHeaderCell(string text)
        {
            itemsTable.AddHeaderCell(
                new Cell().SetBackgroundColor(PrimaryBlue)
                    .SetBorder(Border.NO_BORDER).SetPadding(8)
                    .Add(new Paragraph(text).SetFont(fontBold).SetFontSize(9)
                        .SetFontColor(ColorConstants.WHITE)));
        }

        AddHeaderCell("Product");
        AddHeaderCell("Qty");
        AddHeaderCell("Unit Price");
        AddHeaderCell("Total");

        var items = order.Items.ToList();
        for (var i = 0; i < items.Count; i++)
        {
            var item = items[i];
            var bg = i % 2 == 0 ? ColorConstants.WHITE : LightGray;

            var nameCell = new Cell().SetBorder(Border.NO_BORDER)
                .SetBorderBottom(new SolidBorder(BorderGray, 0.5f))
                .SetBackgroundColor(bg).SetPadding(8);
            nameCell.Add(new Paragraph(item.ProductName).SetFont(fontBold).SetFontSize(9).SetFontColor(TextDark));
            if (!string.IsNullOrEmpty(item.VariantLabel))
                nameCell.Add(new Paragraph(item.VariantLabel).SetFont(fontNormal).SetFontSize(8).SetFontColor(TextMuted));
            itemsTable.AddCell(nameCell);

            itemsTable.AddCell(new Cell().SetBorder(Border.NO_BORDER)
                .SetBorderBottom(new SolidBorder(BorderGray, 0.5f))
                .SetBackgroundColor(bg).SetPadding(8).SetTextAlignment(TextAlignment.CENTER)
                .Add(new Paragraph(item.Quantity.ToString()).SetFont(fontNormal).SetFontSize(9).SetFontColor(TextDark)));

            itemsTable.AddCell(new Cell().SetBorder(Border.NO_BORDER)
                .SetBorderBottom(new SolidBorder(BorderGray, 0.5f))
                .SetBackgroundColor(bg).SetPadding(8).SetTextAlignment(TextAlignment.RIGHT)
                .Add(new Paragraph($"₹{item.UnitPrice:N2}").SetFont(fontNormal).SetFontSize(9).SetFontColor(TextDark)));

            itemsTable.AddCell(new Cell().SetBorder(Border.NO_BORDER)
                .SetBorderBottom(new SolidBorder(BorderGray, 0.5f))
                .SetBackgroundColor(bg).SetPadding(8).SetTextAlignment(TextAlignment.RIGHT)
                .Add(new Paragraph($"₹{item.Subtotal:N2}").SetFont(fontBold).SetFontSize(9).SetFontColor(TextDark)));
        }

        document.Add(itemsTable);
        document.Add(new Paragraph(" ").SetFontSize(4));

        // ── Totals ──────────────────────────────────────────────────────────────
        var totalsTable = new Table(UnitValue.CreatePercentArray([70, 30])).UseAllAvailableWidth();
        totalsTable.SetBorder(Border.NO_BORDER);

        void AddTotalRow(string label, string value, bool isGrand = false)
        {
            var font = isGrand ? fontBold : fontNormal;
            var size = isGrand ? 11f : 9f;
            var color = isGrand ? PrimaryBlue : (Color)TextDark;

            totalsTable.AddCell(new Cell().SetBorder(Border.NO_BORDER)
                .SetPadding(4).SetTextAlignment(TextAlignment.RIGHT)
                .Add(new Paragraph(label).SetFont(font).SetFontSize(size).SetFontColor(isGrand ? TextDark : TextMuted)));
            totalsTable.AddCell(new Cell().SetBorder(Border.NO_BORDER)
                .SetPadding(4).SetTextAlignment(TextAlignment.RIGHT)
                .Add(new Paragraph(value).SetFont(font).SetFontSize(size).SetFontColor(color)));
        }

        var subtotal = order.Items.Sum(i => i.Subtotal);
        AddTotalRow("Subtotal", $"₹{subtotal:N2}");

        if (order.DiscountAmount > 0)
            AddTotalRow($"Discount ({order.CouponCode})", $"-₹{order.DiscountAmount:N2}");

        // separator
        totalsTable.AddCell(new Cell(1, 2).SetBorder(Border.NO_BORDER)
            .SetBorderTop(new SolidBorder(BorderGray, 1)).SetPadding(2));

        AddTotalRow("Grand Total", $"₹{order.TotalAmount:N2}", isGrand: true);
        AddTotalRow("Payment Method", order.PaymentMethod);

        document.Add(totalsTable);
        document.Add(new Paragraph(" ").SetFontSize(8));

        // ── Footer ──────────────────────────────────────────────────────────────
        var footerBg = new Table(1).UseAllAvailableWidth()
            .SetBorder(Border.NO_BORDER);
        var footerCell = new Cell().SetBackgroundColor(PrimaryBlue)
            .SetBorder(Border.NO_BORDER).SetPadding(10).SetTextAlignment(TextAlignment.CENTER);
        footerCell.Add(new Paragraph("Thank you for shopping with PrakashMart")
            .SetFont(fontBold).SetFontSize(9).SetFontColor(ColorConstants.WHITE));
        footerCell.Add(new Paragraph("This is a computer-generated invoice and does not require a signature.")
            .SetFont(fontNormal).SetFontSize(7).SetFontColor(ColorConstants.WHITE));
        footerBg.AddCell(footerCell);
        document.Add(footerBg);

        document.Close();
        return stream.ToArray();
    }
}
