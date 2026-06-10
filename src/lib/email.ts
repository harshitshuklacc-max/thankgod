import { Resend } from "resend";

import { formatCurrency, formatDateTime, STORE_INFO } from "@/lib/utils";
import type { Order, Product } from "@/types/database";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM ?? "orders@shoemafia.in";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? FROM_EMAIL;
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type EmailResult = { success: boolean; error?: string; id?: string };

async function sendEmail(
  to: string | string[],
  subject: string,
  html: string
): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured, skipping email:", subject);
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${STORE_INFO.name} <${FROM_EMAIL}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return { success: false, error: message };
  }
}

function emailLayout(title: string, body: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>${title}</title></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #000; color: #fff; padding: 20px; text-align: center;">
          <h1 style="margin: 0; color: #16A34A;">${STORE_INFO.name}</h1>
        </div>
        <div style="padding: 24px; border: 1px solid #eee;">
          ${body}
        </div>
        <div style="padding: 16px; text-align: center; font-size: 12px; color: #666;">
          <p>${STORE_INFO.address}</p>
          <p>Phone: ${STORE_INFO.phone}</p>
          <p><a href="${SITE_URL}">${SITE_URL}</a></p>
        </div>
      </body>
    </html>
  `;
}

export async function sendOrderConfirmedEmail(order: Order): Promise<EmailResult> {
  if (!order.customer_email) {
    return { success: false, error: "No customer email on order" };
  }

  const items = order.order_items ?? [];
  const itemsHtml = items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product_name}${item.size ? ` (${item.size})` : ""}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.total_price)}</td>
        </tr>`
    )
    .join("");

  const html = emailLayout(
    "Order Confirmed",
    `
      <h2>Thank you for your order!</h2>
      <p>Hi ${order.customer_name ?? "Customer"},</p>
      <p>Your order <strong>${order.order_number}</strong> has been confirmed.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 8px; text-align: left;">Item</th>
            <th style="padding: 8px; text-align: center;">Qty</th>
            <th style="padding: 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 12px 8px; text-align: right; font-weight: bold;">Grand Total</td>
            <td style="padding: 12px 8px; text-align: right; font-weight: bold;">${formatCurrency(order.grand_total)}</td>
          </tr>
        </tfoot>
      </table>
      <p><a href="${SITE_URL}/account/orders" style="display: inline-block; background: #16A34A; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Order</a></p>
    `
  );

  return sendEmail(order.customer_email, `Order Confirmed - ${order.order_number}`, html);
}

export async function sendOrderShippedEmail(order: Order): Promise<EmailResult> {
  if (!order.customer_email) {
    return { success: false, error: "No customer email on order" };
  }

  const html = emailLayout(
    "Order Shipped",
    `
      <h2>Your order is on the way!</h2>
      <p>Hi ${order.customer_name ?? "Customer"},</p>
      <p>Great news! Your order <strong>${order.order_number}</strong> has been shipped.</p>
      <p>We'll notify you when it's delivered.</p>
      <p><a href="${SITE_URL}/account/orders" style="display: inline-block; background: #16A34A; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Track Order</a></p>
    `
  );

  return sendEmail(order.customer_email, `Order Shipped - ${order.order_number}`, html);
}

export async function sendOrderDeliveredEmail(order: Order): Promise<EmailResult> {
  if (!order.customer_email) {
    return { success: false, error: "No customer email on order" };
  }

  const html = emailLayout(
    "Order Delivered",
    `
      <h2>Your order has been delivered!</h2>
      <p>Hi ${order.customer_name ?? "Customer"},</p>
      <p>Your order <strong>${order.order_number}</strong> has been delivered. We hope you love your new shoes!</p>
      <p>Please take a moment to leave a review — your feedback helps other shoppers.</p>
      <p><a href="${SITE_URL}/account/orders" style="display: inline-block; background: #16A34A; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Leave a Review</a></p>
    `
  );

  return sendEmail(order.customer_email, `Order Delivered - ${order.order_number}`, html);
}

export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
): Promise<EmailResult> {
  const html = emailLayout(
    "Password Reset",
    `
      <h2>Reset your password</h2>
      <p>We received a request to reset your password for your ${STORE_INFO.name} account.</p>
      <p>Click the button below to set a new password. This link expires in 1 hour.</p>
      <p><a href="${resetLink}" style="display: inline-block; background: #16A34A; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
      <p style="font-size: 12px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
    `
  );

  return sendEmail(email, `Password Reset - ${STORE_INFO.name}`, html);
}

export async function sendAdminNewOrderEmail(order: Order): Promise<EmailResult> {
  const html = emailLayout(
    "New Order",
    `
      <h2>New order received</h2>
      <p><strong>Order:</strong> ${order.order_number}</p>
      <p><strong>Customer:</strong> ${order.customer_name ?? "N/A"}</p>
      <p><strong>Phone:</strong> ${order.customer_phone ?? "N/A"}</p>
      <p><strong>Email:</strong> ${order.customer_email ?? "N/A"}</p>
      <p><strong>Total:</strong> ${formatCurrency(order.grand_total)}</p>
      <p><strong>Payment:</strong> ${order.payment_method ?? "N/A"} (${order.payment_status})</p>
      <p><strong>Time:</strong> ${formatDateTime(order.created_at)}</p>
      <p><a href="${SITE_URL}/admin/orders" style="display: inline-block; background: #16A34A; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View in Admin</a></p>
    `
  );

  return sendEmail(ADMIN_EMAIL, `New Order - ${order.order_number}`, html);
}

export async function sendLowStockAlertEmail(
  products: Array<{
    product: Pick<Product, "id" | "name" | "sku" | "barcode">;
    quantity: number;
    low_stock_threshold: number;
  }>
): Promise<EmailResult> {
  if (products.length === 0) {
    return { success: true };
  }

  const rows = products
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product.sku ?? "—"}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center; color: #16A34A; font-weight: bold;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.low_stock_threshold}</td>
        </tr>`
    )
    .join("");

  const html = emailLayout(
    "Low Stock Alert",
    `
      <h2>Low stock alert</h2>
      <p>The following products are running low on inventory:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 8px; text-align: left;">Product</th>
            <th style="padding: 8px; text-align: left;">SKU</th>
            <th style="padding: 8px; text-align: center;">Qty</th>
            <th style="padding: 8px; text-align: center;">Threshold</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p><a href="${SITE_URL}/admin/inventory" style="display: inline-block; background: #16A34A; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Manage Inventory</a></p>
    `
  );

  return sendEmail(ADMIN_EMAIL, `Low Stock Alert - ${products.length} product(s)`, html);
}
