'use strict';
const { CustomRequest, CustomDesign } = require('../models');
const { saveImage } = require('../services/storage');
const { bad } = require('../middleware/http');
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

const isPng = (f) => f && f.mimetype === 'image/png' && f.buffer.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
const isJpeg = (f) => f && f.mimetype === 'image/jpeg' && f.buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));

/** Stores a customer's t-shirt design: the mockup they saw and the transparent print artwork. */
exports.createDesign = wrap(async (req, res) => {
  const preview = req.files?.preview?.[0];
  const artwork = req.files?.artwork?.[0];
  if (!(isPng(preview) || isJpeg(preview)) || !isPng(artwork)) throw bad('Your design could not be saved. Please try again.');
  const model = req.body.model === 'woman' ? 'woman' : 'man';
  const [previewUrl, artworkUrl] = await Promise.all([saveImage(preview), saveImage(artwork)]);
  const printSize = ['A4', 'A3', 'A2'].includes(req.body.printSize) ? req.body.printSize : 'A3';
  const design = await CustomDesign.create({ previewUrl, artworkUrl, model, printSize });
  res.status(201).json({ id: design.id, previewUrl, price: orders.CUSTOM_TSHIRT_PRICE });
});
