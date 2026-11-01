'use strict';
const crypto = require('crypto');
const { Op } = require('sequelize');
const db = require('../models');
const paystack = require('./paystack');
const mailer = require('./mailer');

const { sequelize, Order, OrderItem, Payment, ProductVariant, Product, DeliveryFee, Discount } = db;

const httpError = (status, message, extra) => Object.assign(new Error(message), { status, ...extra });

/** SV-YYMMDD-XXXX, short enough to read out over the phone. */
function newOrderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `SV-${ymd}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

function discountAmountFor(discount, subtotal) {
  if (!discount) return 0;
  const raw = discount.type === 'percentage' ? Math.floor((subtotal * discount.value) / 100) : discount.value;
  return Math.min(raw, subtotal);
}

/** Throws a 400 with a customer-facing message when a code can't be used. */
async function resolveDiscount(code, subtotal) {
  if (!code) return null;
  const discount = await Discount.findOne({ where: { code: String(code).trim().toUpperCase() } });
  if (!discount || !discount.isActive) throw httpError(400, 'That discount code is not valid.');
  if (discount.expiresAt && discount.expiresAt < new Date()) throw httpError(400, 'That discount code has expired.');
  if (discount.usageLimit != null && discount.usedCount >= discount.usageLimit) {
    throw httpError(400, 'That discount code has been fully redeemed.');
  }
  if (subtotal < (discount.minSubtotal || 0)) {
    throw httpError(400, `Spend at least ₦${discount.minSubtotal.toLocaleString('en-NG')} to use this code.`);
  }
  return discount;
}

/**
 * Prices a cart from the database. The browser only sends SKUs and quantities,
 * so a tampered price can never reach Paystack.
 */
async function priceCart({ items, state, discountCode }) {
  if (!Array.isArray(items) || items.length === 0) throw httpError(400, 'Your bag is empty.');

  const merged = new Map();
  for (const it of items) {
    const qty = Number(it.qty);
    if (!it.sku || !Number.isInteger(qty) || qty < 1 || qty > 50) throw httpError(400, 'Invalid item in your bag.');
    merged.set(it.sku, (merged.get(it.sku) || 0) + qty);
  }

  const variants = await ProductVariant.findAll({
    where: { sku: { [Op.in]: [...merged.keys()] } },
    include: [{ model: Product, as: 'product' }],
  });
  const bySku = new Map(variants.map((v) => [v.sku, v]));

  const lines = [];
  for (const [sku, qty] of merged) {
    const v = bySku.get(sku);
    if (!v || !v.product.isActive) throw httpError(400, 'An item in your bag is no longer available.', { sku });
    if (v.stock < qty) {
      throw httpError(409, v.stock === 0
        ? `${v.product.name} (${v.color}, ${v.size}) is sold out.`
        : `Only ${v.stock} left of ${v.product.name} (${v.color}, ${v.size}).`, { sku, available: v.stock });
    }
    const images = v.product.imagesByColor?.[v.color] || v.product.images || [];
    lines.push({
      sku,
      productName: v.product.name,
      productSlug: v.product.slug,
      color: v.color,
      size: v.size,
      image: images[0] || null,
      unitPrice: v.product.price,
      quantity: qty,
      lineTotal: v.product.price * qty,
    });
  }

  const fee = await DeliveryFee.findOne({ where: { state, isActive: true } });
  if (!fee) throw httpError(400, 'We do not deliver to that state yet.');

  const subtotal = lines.reduce((n, l) => n + l.lineTotal, 0);
  const discount = await resolveDiscount(discountCode, subtotal);
  const discountAmount = discountAmountFor(discount, subtotal);
  const total = subtotal - discountAmount + fee.fee;

  return { lines, subtotal, discount, discountAmount, shippingFee: fee.fee, total };
}

/** Creates the unpaid order and the Paystack transaction that will pay for it. */
async function checkout({ user, customer, shipping, items, discountCode }) {
  const priced = await priceCart({ items, state: shipping.state, discountCode });
  const orderNumber = newOrderNumber();
  const reference = `${orderNumber}-${crypto.randomBytes(3).toString('hex')}`;

  const order = await sequelize.transaction(async (transaction) => {
    const created = await Order.create({
      orderNumber,
      userId: user?.id ?? null,
      email: customer.email,
      customerName: customer.name,
      phone: customer.phone,
      shippingAddress: shipping.address,
      shippingCity: shipping.city,
      shippingState: shipping.state,
      subtotal: priced.subtotal,
      discountAmount: priced.discountAmount,
      discountCode: priced.discount?.code ?? null,
      shippingFee: priced.shippingFee,
      total: priced.total,
      paymentReference: reference,
    }, { transaction });
    await OrderItem.bulkCreate(priced.lines.map((l) => ({ ...l, orderId: created.id })), { transaction });
    await Payment.create({ orderId: created.id, reference, amount: priced.total }, { transaction });
    return created;
  });

  const callbackUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/order/${orderNumber}`;
  const tx = await paystack.initializeTransaction({
    email: customer.email,
    amount: priced.total,
    reference,
    callbackUrl,
    metadata: { orderNumber, orderId: order.id, customerName: customer.name },
  });

  return {
    orderNumber,
    reference,
    total: priced.total,
    accessCode: tx.access_code,
    authorizationUrl: tx.authorization_url,
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || null,
  };
}

/**
 * Turns a verified Paystack transaction into a paid order. Called from both the
 * browser's verify call and the webhook, so it must be idempotent: the order row
 * is locked and the second caller finds it already paid.
 */
async function finalizePayment(reference, tx) {
  let receiptOrder = null;

  await sequelize.transaction(async (transaction) => {
    // Lock just the order row (Postgres can't lock a joined row), then load its items.
    const order = await Order.findOne({
      where: { paymentReference: reference },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!order) throw httpError(404, 'Order not found for this payment.');
    if (order.paymentStatus === 'paid') return;
    order.items = await OrderItem.findAll({ where: { orderId: order.id }, transaction });

    const payment = await Payment.findOne({ where: { reference }, transaction });

    if (tx.status !== 'success') {
      await payment.update({ status: 'failed', gatewayResponse: tx }, { transaction });
      await order.update({ paymentStatus: 'failed' }, { transaction });
      return;
    }

    // Never trust the client: the amount Paystack actually collected must match the order.
    if (tx.amount !== paystack.toKobo(order.total) || tx.currency !== order.currency) {
      await payment.update({ status: 'failed', gatewayResponse: tx }, { transaction });
      await order.update({
        paymentStatus: 'failed',
        adminNote: `Amount mismatch: paid ${tx.amount / 100} ${tx.currency}, expected ${order.total}. Check Paystack ${reference}.`,
      }, { transaction });
      return;
    }

    // Deduct stock under row locks so two simultaneous payments can't oversell.
    const shortages = [];
    for (const item of order.items) {
      const variant = await ProductVariant.findOne({ where: { sku: item.sku }, transaction, lock: transaction.LOCK.UPDATE });
      if (!variant) { shortages.push(`${item.sku} (removed)`); continue; }
      const take = Math.min(variant.stock, item.quantity);
      if (take < item.quantity) shortages.push(`${item.productName} ${item.color}/${item.size}: wanted ${item.quantity}, had ${variant.stock}`);
      if (take > 0) await variant.update({ stock: variant.stock - take }, { transaction });
    }

    if (order.discountCode) {
      await Discount.increment('usedCount', { where: { code: order.discountCode }, transaction });
    }

    await payment.update({
      status: 'success',
      channel: tx.channel,
      gatewayTransactionId: String(tx.id ?? ''),
      gatewayResponse: tx,
      paidAt: tx.paid_at ? new Date(tx.paid_at) : new Date(),
    }, { transaction });

    await order.update({
      paymentStatus: 'paid',
      status: 'processing',
      paidAt: new Date(),
      stockDeducted: true,
      adminNote: shortages.length
        ? `PAID BUT SHORT ON STOCK, contact customer or refund: ${shortages.join('; ')}`
        : order.adminNote,
    }, { transaction });

    receiptOrder = order;
  });

  if (receiptOrder) {
    mailer.sendReceipt(receiptOrder);
    mailer.notifyStore(`New order ${receiptOrder.orderNumber}`,
      `<p>${receiptOrder.customerName} paid ₦${receiptOrder.total.toLocaleString('en-NG')} for ${receiptOrder.orderNumber}.${
        receiptOrder.adminNote ? `<br><b>${receiptOrder.adminNote}</b>` : ''}</p>`);
  }
}

/** Asks Paystack for the truth about a reference and applies it to the order. */
async function verifyAndFinalize(reference) {
  const tx = await paystack.verifyTransaction(reference);
  await finalizePayment(reference, tx);
  return tx;
}

/** Puts stock back when a paid order is cancelled or refunded (once only). */
async function restockOrder(order, transaction) {
  if (!order.stockDeducted) return;
  const items = order.items || await OrderItem.findAll({ where: { orderId: order.id }, transaction });
  for (const item of items) {
    await ProductVariant.increment('stock', { by: item.quantity, where: { sku: item.sku }, transaction });
  }
  await order.update({ stockDeducted: false }, { transaction });
}

module.exports = { priceCart, checkout, verifyAndFinalize, finalizePayment, restockOrder, resolveDiscount, discountAmountFor, httpError };
