const nodemailer = require('nodemailer');

const recipient = 'dinosaurcrackersofficial@gmail.com';

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function formatMoney(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

async function sendOrderEmail(order) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn(`Order email not sent for ${order.id}: SMTP is not configured.`);
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
  const safe = escapeHtml;
  const rows = order.items.map(item => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${safe(item.product_name)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee">${safe(item.product_code || '—')}</td>
      <td style="padding:8px;border-bottom:1px solid #eee">${safe(item.content || '—')}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatMoney(item.price)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatMoney(item.subtotal)}</td>
    </tr>`).join('');

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: recipient,
    subject: `New order ${order.id} — ${order.customer_name}`,
    text: [
      `New order received: ${order.id}`,
      `Tracking / Order ID: ${order.id}`,
      `Date: ${order.created_at}`,
      `Customer: ${order.customer_name}`,
      `Phone: ${order.phone}`,
      `Email: ${order.email || 'Not provided'}`,
      `Address: ${order.address}, ${order.city}, ${order.pincode}`,
      `Notes: ${order.notes || 'None'}`,
      `Items:`,
      ...order.items.map(item => `- ${item.product_name} (${item.product_code || 'no code'}), ${item.content || ''}, qty ${item.quantity}, ${formatMoney(item.price)} each, subtotal ${formatMoney(item.subtotal)}`),
      `Promo: ${order.promo_code || 'None'}`,
      `Discount: ${formatMoney(order.promo_discount)}`,
      `Total: ${formatMoney(order.total_amount)}`,
      `Status: ${order.status}`,
      `Courier/AWB: Not assigned yet`
    ].join('\n'),
    html: `<div style="font-family:Arial,sans-serif;color:#222;max-width:760px;margin:auto">
      <h2 style="color:#b91c1c">New order received</h2>
      <p><strong>Order tracking ID:</strong> ${safe(order.id)}<br><strong>Date:</strong> ${safe(order.created_at)}<br><strong>Status:</strong> ${safe(order.status)}</p>
      <h3>Customer and delivery</h3>
      <p><strong>Name:</strong> ${safe(order.customer_name)}<br><strong>Phone:</strong> ${safe(order.phone)}<br><strong>Email:</strong> ${safe(order.email || 'Not provided')}<br><strong>Address:</strong> ${safe(order.address)}, ${safe(order.city)}, ${safe(order.pincode)}<br><strong>Delivery notes:</strong> ${safe(order.notes || 'None')}</p>
      <h3>Items</h3><table style="border-collapse:collapse;width:100%;text-align:left"><thead><tr>${['Product','Code','Pack','Qty','Price','Subtotal'].map(label => `<th style="padding:8px;background:#f3f4f6">${label}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
      <p>Promo: ${safe(order.promo_code || 'None')}<br>Discount: ${formatMoney(order.promo_discount)}<br><strong>Total: ${formatMoney(order.total_amount)}</strong></p>
      <p>Courier and carrier AWB are not assigned yet. Use order ID <strong>${safe(order.id)}</strong> as the tracking reference for now.</p>
    </div>`
  });
  return true;
}

module.exports = { sendOrderEmail };
