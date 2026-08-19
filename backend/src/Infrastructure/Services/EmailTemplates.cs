using PrakashMart.Application.DTOs.Orders;

namespace PrakashMart.Infrastructure.Services;

internal static class EmailTemplates
{
    public static string Welcome(string userName) =>
        Layout("Welcome to PrakashMart!", $$"""
            <p style="margin:0 0 8px;color:#212121;font-size:14px;">Hi <strong>{{userName}}</strong>,</p>
            <p style="margin:0 0 20px;color:#555;font-size:13px;">
              Welcome to <strong>PrakashMart</strong>! Your account has been created successfully.
            </p>

            <!-- Wallet Bonus Box -->
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#e8f5e9;border:1px solid #a5d6a7;border-radius:4px;margin-bottom:20px;">
              <tr>
                <td style="padding:14px 16px;">
                  <p style="margin:0 0 4px;color:#1b5e20;font-size:14px;font-weight:700;">
                    🎉 ₹50 Welcome Bonus Added to Your Wallet!
                  </p>
                  <p style="margin:0;color:#2e7d32;font-size:13px;">
                    We've added ₹50 to your PrakashMart Wallet as a welcome gift.
                    Use it on your first order!
                  </p>
                </td>
              </tr>
            </table>

            <!-- What you can do -->
            <p style="margin:0 0 10px;color:#212121;font-size:13px;font-weight:700;">Get started:</p>
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#f8f8f8;border:1px solid #e0e0e0;border-radius:4px;margin-bottom:20px;">
              <tr><td style="padding:12px 16px;color:#555;font-size:13px;border-bottom:1px solid #e0e0e0;">🛍️ Browse thousands of products across categories</td></tr>
              <tr><td style="padding:12px 16px;color:#555;font-size:13px;border-bottom:1px solid #e0e0e0;">❤️ Save your favourites to your Wishlist</td></tr>
              <tr><td style="padding:12px 16px;color:#555;font-size:13px;">🎟️ Use coupon codes like <strong>WELCOME10</strong> for extra savings</td></tr>
            </table>

            <p style="margin:0;color:#878787;font-size:12px;">
              If you did not create this account, please ignore this email.
            </p>
            """);

    public static string PasswordReset(string userName, string resetUrl) =>
        Layout("Password Reset", $$"""
            <p style="margin:0 0 8px;color:#212121;font-size:14px;">Hi <strong>{{userName}}</strong>,</p>
            <p style="margin:0 0 20px;color:#555;font-size:13px;">
              We received a request to reset your PrakashMart password.
              Click the button below to choose a new password.
            </p>
            <div style="text-align:center;margin:28px 0;">
              <a href="{{resetUrl}}"
                 style="background:#2874f0;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:4px;font-size:14px;font-weight:700;display:inline-block;">
                Reset Password
              </a>
            </div>
            <p style="margin:0;color:#878787;font-size:12px;">
              This link expires in <strong>1 hour</strong>.
              If you did not request a password reset, you can safely ignore this email — your password will not change.
            </p>
            """);

    public static string OrderConfirmation(string userName, OrderDto order) =>
        Layout("Order Placed ✓", BuildOrderBody(userName, order,
            headerLine: "Your order has been successfully placed.",
            badgeColor: "#26a541"));

    public static string OrderStatusUpdate(string userName, OrderDto order) =>
        Layout($"Order {order.Status}", BuildOrderBody(userName, order,
            headerLine: $"Your order status has been updated to <strong>{order.Status}</strong>.",
            badgeColor: StatusColor(order.Status)));

    public static string OrderCancelled(string userName, OrderDto order, decimal walletCredited) =>
        Layout("Order Cancelled", $$"""
            <p style="margin:0 0 6px;color:#212121;font-size:14px;">Hi <strong>{{userName}}</strong>,</p>
            <p style="margin:0 0 20px;color:#555;font-size:13px;">
              Your order <strong>#{{order.Id.ToString()[..8].ToUpper()}}</strong> has been cancelled.
            </p>

            {{(walletCredited > 0 ? $$"""
            <!-- Wallet Refund Box -->
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#e8f5e9;border:1px solid #a5d6a7;border-radius:4px;margin-bottom:20px;">
              <tr>
                <td style="padding:14px 16px;">
                  <p style="margin:0 0 6px;color:#1b5e20;font-size:14px;font-weight:700;">
                    ₹{{walletCredited:N0}} credited to your Wallet
                  </p>
                  <p style="margin:0;color:#2e7d32;font-size:13px;">
                    Your refund of <strong>₹{{walletCredited:N0}}</strong> has been added to your PrakashMart Wallet.
                    It will be reflected within <strong>2–3 business days</strong>.
                    You can use your wallet balance on your next order.
                  </p>
                </td>
              </tr>
            </table>
            """ : """
            <p style="color:#878787;font-size:13px;margin-bottom:20px;">
              As this was a Cash on Delivery order, no refund is applicable.
            </p>
            """)}}

            <!-- Order Meta -->
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#f8f8f8;border:1px solid #e0e0e0;border-radius:4px;">
              <tr>
                <td style="padding:14px 16px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color:#878787;font-size:12px;padding-bottom:6px;">Order ID</td>
                      <td align="right" style="color:#212121;font-size:12px;font-weight:700;padding-bottom:6px;">
                        #{{order.Id.ToString()[..8].ToUpper()}}
                      </td>
                    </tr>
                    <tr>
                      <td style="color:#878787;font-size:12px;padding-bottom:6px;">Order Date</td>
                      <td align="right" style="color:#212121;font-size:12px;padding-bottom:6px;">
                        {{order.CreatedAt:dd MMM yyyy}}
                      </td>
                    </tr>
                    <tr>
                      <td style="color:#878787;font-size:12px;">Order Amount</td>
                      <td align="right" style="color:#212121;font-size:12px;font-weight:700;">
                        ₹{{order.TotalAmount:N0}}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <p style="margin:20px 0 0;color:#878787;font-size:12px;">
              If you have any questions, please contact our support team.
            </p>
            """);

    private static string Layout(string title, string bodyHtml) => $$"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
        <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding:24px 0;">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">

                  <!-- Header -->
                  <tr>
                    <td style="background:#2874f0;padding:18px 24px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td><span style="color:#ffffff;font-size:22px;font-weight:800;">PrakashMart</span></td>
                          <td align="right"><span style="color:#ffffff;font-size:14px;font-weight:700;">{{title}}</span></td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr><td style="padding:24px;">{{bodyHtml}}</td></tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#2874f0;padding:14px 24px;text-align:center;">
                      <p style="margin:0;color:#ffffff;font-size:12px;">
                        Thank you for shopping with <strong>PrakashMart</strong> &nbsp;·&nbsp;
                        <a href="#" style="color:#ffe500;text-decoration:none;">24x7 Customer Care</a>
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """;

    private static string BuildOrderBody(string userName, OrderDto order, string headerLine, string badgeColor)
    {
        var itemsHtml = string.Concat(order.Items.Select(i => $$"""
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#212121;font-size:13px;">
                      {{i.ProductName}}{{(i.VariantLabel is not null ? $" <span style='color:#878787'>({i.VariantLabel})</span>" : "")}}
                    </td>
                    <td align="right" style="color:#212121;font-size:13px;font-weight:700;white-space:nowrap;">
                      ₹{{i.UnitPrice:N0}} × {{i.Quantity}}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            """));

        var couponHtml = order.DiscountAmount > 0 ? $$"""
            <tr>
              <td style="color:#878787;font-size:13px;padding-bottom:6px;">
                Coupon ({{order.CouponCode}}) &nbsp;
                <span style="color:#26a541;">-₹{{order.DiscountAmount:N0}}</span>
              </td>
            </tr>
            """ : "";

        return $$"""
            <p style="margin:0 0 6px;color:#212121;font-size:14px;">Hi <strong>{{userName}}</strong>,</p>
            <p style="margin:0 0 20px;color:#555;font-size:13px;">{{headerLine}}</p>

            <!-- Status badge -->
            <div style="display:inline-block;background:{{badgeColor}};color:#fff;font-size:12px;font-weight:700;padding:4px 12px;border-radius:12px;margin-bottom:20px;">
              {{order.Status}}
            </div>

            <!-- Order Meta -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;border:1px solid #e0e0e0;border-radius:4px;margin-bottom:20px;">
              <tr>
                <td style="padding:14px 16px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color:#878787;font-size:12px;padding-bottom:6px;">Order ID</td>
                      <td align="right" style="color:#212121;font-size:12px;font-weight:700;padding-bottom:6px;word-break:break-all;">{{order.Id}}</td>
                    </tr>
                    <tr>
                      <td style="color:#878787;font-size:12px;padding-bottom:6px;">Order Date</td>
                      <td align="right" style="color:#212121;font-size:12px;padding-bottom:6px;">{{order.CreatedAt:dd MMM yyyy}}</td>
                    </tr>
                    <tr>
                      <td style="color:#878787;font-size:12px;padding-bottom:6px;">Payment</td>
                      <td align="right" style="color:#212121;font-size:12px;padding-bottom:6px;">{{order.PaymentMethod}}</td>
                    </tr>
                    <tr>
                      <td style="color:#878787;font-size:12px;">Delivery Address</td>
                      <td align="right" style="color:#212121;font-size:12px;">{{order.ShippingAddress}}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Items -->
            <p style="margin:0 0 8px;color:#212121;font-size:13px;font-weight:700;">Items Ordered</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              {{itemsHtml}}
            </table>

            <!-- Totals -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;border:1px solid #e0e0e0;border-radius:4px;">
              <tr>
                <td style="padding:14px 16px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    {{couponHtml}}
                    <tr>
                      <td style="color:#212121;font-size:14px;font-weight:700;">Amount Paid</td>
                      <td align="right" style="color:#2874f0;font-size:16px;font-weight:700;">₹{{order.TotalAmount:N0}}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            """;
    }

    private static string StatusColor(string status) => status.ToLower() switch
    {
        "delivered" => "#26a541",
        "shipped" or "intransit" => "#2874f0",
        "cancelled" => "#d32f2f",
        _ => "#ff9800"
    };
}
