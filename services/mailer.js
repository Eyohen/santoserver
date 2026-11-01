'use strict';
const nodemailer = require('nodemailer');

let transporter;
function getTransporter() {
  if (transporter !== undefined) return transporter;
  const { EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_PORT } = process.env;
  transporter = EMAIL_HOST && EMAIL_USER && EMAIL_PASS
    ? nodemailer.createTransport({
        host: EMAIL_HOST,
        port: Number(EMAIL_PORT) || 587,
        secure: Number(EMAIL_PORT) === 465,
        auth: { user: EMAIL_USER, pass: EMAIL_PASS },
      })
    : null;
  return transporter;
}

const naira = (n) => `₦${Number(n).toLocaleString('en-NG')}`;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Email failures must never fail an order, so everything here is best-effort. */
async function send({ to, subject, html }) {
  const t = getTransporter();
  if (!t) return console.log(`[mail] not configured, skipped "${subject}" to ${to}`);
  try {
    await t.sendMail({ from: `Santo Veste <${process.env.EMAIL_USER}>`, to, subject, html });
  } catch (err) {
    console.error('[mail] failed:', err.message);
  }
}

function sendReceipt(order) {
  const rows = order.items
    .map((i) => `<tr><td>${esc(i.productName)} (${esc(i.color)}, ${esc(i.size)}) × ${i.quantity}</td><td align="right">${naira(i.lineTotal)}</td></tr>`)
    .join('');
  return send({
    to: order.email,
    subject: `Your Santo Veste order ${order.orderNumber}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
      <h2>Thank you, ${esc(order.customerName)}.</h2>
      <p>We've received your payment for order <b>${esc(order.orderNumber)}</b>. We'll email you when it ships.</p>
      <table width="100%" cellpadding="6">${rows}
        <tr><td>Delivery</td><td align="right">${naira(order.shippingFee)}</td></tr>
        ${order.discountAmount ? `<tr><td>Discount</td><td align="right">-${naira(order.discountAmount)}</td></tr>` : ''}
        <tr><td><b>Total</b></td><td align="right"><b>${naira(order.total)}</b></td></tr></table>
      <p>Delivering to: ${esc(order.shippingAddress)}, ${esc(order.shippingCity)}, ${esc(order.shippingState)}</p></div>`,
  });
}

function sendShipped(order) {
  return send({
    to: order.email,
    subject: `Your Santo Veste order ${order.orderNumber} is on its way`,
    html: `<p>Hi ${esc(order.customerName)}, order <b>${esc(order.orderNumber)}</b> has shipped.${
      order.trackingNumber ? ` Tracking: <b>${esc(order.trackingNumber)}</b>.` : ''}</p>`,
  });
}

function notifyStore(subject, html) {
  const to = process.env.STORE_NOTIFY_EMAIL || process.env.EMAIL_USER;
  return to ? send({ to, subject, html }) : undefined;
}

module.exports = { sendReceipt, sendShipped, notifyStore, send };
