'use strict';
const { Order, OrderItem } = require('../models');
const orders = require('../services/orders');
const { wrap, bad, str, email, phone } = require('../middleware/http');

const publicOrder = (o) => ({
  orderNumber: o.orderNumber,
  status: o.status,
  paymentStatus: o.paymentStatus,
  email: o.email,
  customerName: o.customerName,
  shipping: { address: o.shippingAddress, city: o.shippingCity, state: o.shippingState },
  subtotal: o.subtotal,
  discountAmount: o.discountAmount,
  discountCode: o.discountCode,
  shippingFee: o.shippingFee,
  total: o.total,
  trackingNumber: o.trackingNumber,
  createdAt: o.createdAt,
  items: (o.items || []).map((i) => ({
    sku: i.sku, name: i.productName, slug: i.productSlug, color: i.color, size: i.size,
    image: i.image, unitPrice: i.unitPrice, quantity: i.quantity, lineTotal: i.lineTotal,
  })),
});
exports.publicOrder = publicOrder;

const withItems = [{ model: OrderItem, as: 'items' }];

/** Prices the cart (subtotal, discount, delivery, total) without creating anything. */
exports.quote = wrap(async (req, res) => {
  const { items, state, discountCode } = req.body;
  const q = await orders.priceCart({ items, state, discountCode });
  res.json({
    subtotal: q.subtotal,
    discountAmount: q.discountAmount,
    shippingFee: q.shippingFee,
    total: q.total,
    discountCode: q.discount?.code ?? null,
  });
});

/** Creates an unpaid order and returns what the browser needs to open Paystack. */
exports.checkout = wrap(async (req, res) => {
  const b = req.body || {};
  const customer = { email: email(b.email), name: str(b.name, 'Name', { max: 120 }), phone: phone(b.phone) };
  const shipping = {
    address: str(b.address, 'Address', { max: 240 }),
    city: str(b.city, 'City', { max: 100 }),
    state: str(b.state, 'State', { max: 60 }),
  };
  if (!Array.isArray(b.items)) throw bad('Your bag is empty.');
  const result = await orders.checkout({
    user: req.user, customer, shipping, items: b.items, discountCode: b.discountCode,
  });
  res.status(201).json(result);
});

/** Called by the storefront when Paystack returns. Safe to call repeatedly. */
exports.verify = wrap(async (req, res) => {
  const reference = str(req.body.reference, 'Reference', { max: 120 });
  const order = await Order.findOne({ where: { paymentReference: reference } });
  if (!order) return res.status(404).json({ message: 'We could not find that payment.' });
  if (order.paymentStatus !== 'paid') await orders.verifyAndFinalize(reference);
  const fresh = await Order.findByPk(order.id, { include: withItems });
  res.json({ order: publicOrder(fresh) });
});

/** Guest-friendly lookup: the order number plus the email it was placed with. */
exports.track = wrap(async (req, res) => {
  const orderNumber = str(req.query.orderNumber, 'Order number', { max: 40 }).toUpperCase();
  const order = await Order.findOne({ where: { orderNumber }, include: withItems });
  if (!order || order.email !== email(req.query.email)) {
    return res.status(404).json({ message: 'We could not find an order with those details.' });
  }
  res.json({ order: publicOrder(order) });
});

exports.myOrders = wrap(async (req, res) => {
  const rows = await Order.findAll({
    where: { userId: req.user.id },
    include: withItems,
    order: [['createdAt', 'DESC']],
  });
  res.json({ orders: rows.map(publicOrder) });
});
