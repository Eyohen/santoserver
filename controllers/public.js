'use strict';
const { CustomRequest } = require('../models');
const orders = require('../services/orders');
const mailer = require('../services/mailer');
const { wrap, str, email, phone, int } = require('../middleware/http');

exports.validateDiscount = wrap(async (req, res) => {
  const subtotal = int(req.body.subtotal, 'Subtotal');
  const discount = await orders.resolveDiscount(req.body.code, subtotal);
  if (!discount) return res.status(400).json({ message: 'Enter a discount code.' });
  res.json({
    code: discount.code,
    type: discount.type,
    value: discount.value,
    amount: orders.discountAmountFor(discount, subtotal),
  });
});

exports.createCustomRequest = wrap(async (req, res) => {
  const b = req.body || {};
  const request = await CustomRequest.create({
    name: str(b.name, 'Name', { max: 120 }),
    email: email(b.email),
    phone: phone(b.phone),
    quantity: int(b.quantity, 'Quantity', { min: 1, max: 100000 }),
    product: str(b.product, 'Product', { max: 120, required: false }) || null,
    message: str(b.message, 'Message', { max: 2000, required: false }) || null,
  });
  mailer.notifyStore(`Custom order request from ${request.name}`,
    `<p>${request.name} (${request.email}, ${request.phone}) wants ${request.quantity} × ${request.product || 'custom pieces'}.</p><p>${request.message || ''}</p>`);
  res.status(201).json({ id: request.id });
});
