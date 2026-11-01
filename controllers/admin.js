'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Op, fn, col, literal } = require('sequelize');
const db = require('../models');
const mailer = require('../services/mailer');
const orders = require('../services/orders');
const { serialize, include: productInclude } = require('./catalogue');
const { publicOrder } = require('./checkout');
const { wrap, bad, str, int } = require('../middleware/http');

const {
  sequelize, Order, OrderItem, Payment, Product, ProductVariant, Category, DeliveryFee, Discount, CustomRequest,
} = db;

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const pageOf = (req) => {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const page = Math.max(Number(req.query.page) || 1, 1);
  return { limit, offset: (page - 1) * limit, page };
};
const adminOrder = (o) => ({
  ...publicOrder(o),
  id: o.id,
  phone: o.phone,
  paidAt: o.paidAt,
  paymentReference: o.paymentReference,
  adminNote: o.adminNote,
  notes: o.notes,
  payments: (o.payments || []).map((p) => ({
    reference: p.reference, status: p.status, channel: p.channel, amount: p.amount, paidAt: p.paidAt,
  })),
});

/* ---------------------------------- stats --------------------------------- */

exports.stats = wrap(async (req, res) => {
  const paid = await Order.findAll({ where: { paymentStatus: 'paid' }, attributes: ['total', 'email', 'paidAt', 'createdAt'] });
  const gross = paid.reduce((n, o) => n + o.total, 0);

  const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const months = [];
  const now = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: monthKey(d), label: d.toLocaleString('en', { month: 'short' }), revenue: 0, orders: 0 });
  }
  paid.forEach((o) => {
    const m = months.find((x) => x.key === monthKey(new Date(o.paidAt || o.createdAt)));
    if (m) { m.revenue += o.total; m.orders += 1; }
  });

  const statusRows = await Order.findAll({
    where: { paymentStatus: { [Op.ne]: 'unpaid' } },
    attributes: ['status', [fn('COUNT', col('id')), 'n']],
    group: ['status'],
    raw: true,
  });
  const recent = await Order.findAll({
    where: { paymentStatus: { [Op.ne]: 'unpaid' } },
    include: [{ model: OrderItem, as: 'items' }],
    order: [['createdAt', 'DESC']],
    limit: 6,
  });
  const lowStock = await ProductVariant.findAll({
    where: { stock: { [Op.lte]: 3 } },
    include: [{ model: Product, as: 'product', where: { isActive: true }, attributes: ['name', 'slug'] }],
    order: [['stock', 'ASC']],
    limit: 12,
  });

  res.json({
    grossSales: gross,
    paidOrders: paid.length,
    averageOrderValue: paid.length ? Math.round(gross / paid.length) : 0,
    customers: new Set(paid.map((o) => o.email)).size,
    awaitingFulfilment: await Order.count({ where: { status: 'processing' } }),
    newCustomRequests: await CustomRequest.count({ where: { status: 'new' } }),
    flaggedOrders: await Order.count({
      where: { adminNote: { [Op.ne]: null }, paymentStatus: 'paid', status: { [Op.in]: ['pending', 'processing'] } },
    }),
    ordersByStatus: Object.fromEntries(statusRows.map((r) => [r.status, Number(r.n)])),
    revenueByMonth: months,
    recentOrders: recent.map(adminOrder),
    lowStock: lowStock.map((v) => ({ sku: v.sku, product: v.product.name, color: v.color, size: v.size, stock: v.stock })),
  });
});

/* --------------------------------- orders --------------------------------- */

exports.listOrders = wrap(async (req, res) => {
  const { limit, offset, page } = pageOf(req);
  const where = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.paymentStatus) where.paymentStatus = req.query.paymentStatus;
  // Unpaid checkouts are abandoned carts; hide them unless asked for.
  else where.paymentStatus = { [Op.ne]: 'unpaid' };
  if (req.query.q) {
    const like = `%${String(req.query.q).trim()}%`;
    where[Op.or] = [
      { orderNumber: { [Op.iLike]: like } },
      { customerName: { [Op.iLike]: like } },
      { email: { [Op.iLike]: like } },
    ];
  }
  const { rows, count } = await Order.findAndCountAll({
    where, limit, offset, distinct: true,
    include: [{ model: OrderItem, as: 'items' }],
    order: [['createdAt', 'DESC']],
  });
  res.json({ orders: rows.map(adminOrder), total: count, page, pages: Math.ceil(count / limit) });
});

exports.getOrder = wrap(async (req, res) => {
  const o = await Order.findByPk(req.params.id, {
    include: [{ model: OrderItem, as: 'items' }, { model: Payment, as: 'payments' }],
  });
  if (!o) return res.status(404).json({ message: 'Order not found.' });
  res.json({ order: adminOrder(o) });
});

const TRANSITIONS = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled', 'refunded'],
  shipped: ['delivered', 'refunded'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

exports.updateOrder = wrap(async (req, res) => {
  const { status, trackingNumber, adminNote } = req.body;
  let shipped = false;

  await sequelize.transaction(async (transaction) => {
    const order = await Order.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!order) throw Object.assign(new Error('Order not found.'), { status: 404 });
    const patch = {};

    if (status && status !== order.status) {
      if (order.paymentStatus !== 'paid' && status !== 'cancelled') {
        throw bad('This order has not been paid yet, so it cannot be fulfilled.');
      }
      if (!TRANSITIONS[order.status]?.includes(status)) {
        throw bad(`An order that is ${order.status} cannot become ${status}.`);
      }
      patch.status = status;
      shipped = status === 'shipped';
      if (status === 'cancelled' || status === 'refunded') {
        await orders.restockOrder(order, transaction);
        if (status === 'refunded') patch.paymentStatus = 'refunded';
      }
    }
    if (trackingNumber !== undefined) patch.trackingNumber = str(trackingNumber, 'Tracking number', { required: false }) || null;
    if (adminNote !== undefined) patch.adminNote = str(adminNote, 'Note', { max: 1000, required: false }) || null;
    await order.update(patch, { transaction });
  });

  const fresh = await Order.findByPk(req.params.id, {
    include: [{ model: OrderItem, as: 'items' }, { model: Payment, as: 'payments' }],
  });
  if (shipped) mailer.sendShipped(fresh);
  res.json({ order: adminOrder(fresh) });
});

exports.listTransactions = wrap(async (req, res) => {
  const { limit, offset, page } = pageOf(req);
  const where = { status: { [Op.ne]: 'pending' } };
  if (req.query.status) where.status = req.query.status;
  const { rows, count } = await Payment.findAndCountAll({
    where, limit, offset,
    include: [{ model: Order, as: 'order', attributes: ['orderNumber', 'customerName', 'email'] }],
    order: [['createdAt', 'DESC']],
  });
  const sums = await Payment.findAll({
    attributes: ['status', [fn('SUM', col('amount')), 'sum'], [fn('COUNT', col('id')), 'n']],
    group: ['status'],
    raw: true,
  });
  res.json({
    transactions: rows.map((p) => ({
      reference: p.reference, orderNumber: p.order?.orderNumber, customer: p.order?.customerName, email: p.order?.email,
      channel: p.channel, amount: p.amount, status: p.status, paidAt: p.paidAt, createdAt: p.createdAt,
    })),
    summary: Object.fromEntries(sums.map((s) => [s.status, { amount: Number(s.sum), count: Number(s.n) }])),
    total: count, page, pages: Math.ceil(count / limit),
  });
});

/* -------------------------------- products -------------------------------- */

async function categoryId(slug) {
  const c = await Category.findOne({ where: { slug: String(slug || '') } });
  if (!c) throw bad('Choose a valid category.', 'category');
  return c.id;
}

function readProduct(b) {
  const name = str(b.name, 'Name', { max: 160 });
  return {
    name,
    slug: str(b.slug, 'Slug', { required: false }) || slugify(name),
    description: str(b.description, 'Description', { max: 4000, required: false }),
    fabrics: str(b.fabrics, 'Fabrics', { required: false }) || null,
    features: str(b.features, 'Features', { required: false }) || null,
    price: int(b.price, 'Price', { min: 1 }),
    compareAtPrice: b.compareAtPrice ? int(b.compareAtPrice, 'Compare-at price', { min: 1 }) : null,
    isNew: Boolean(b.isNew),
    isActive: b.isActive === undefined ? true : Boolean(b.isActive),
    images: Array.isArray(b.images) ? b.images.filter((u) => typeof u === 'string') : [],
    imagesByColor: b.imagesByColor && typeof b.imagesByColor === 'object' ? b.imagesByColor : {},
  };
}

function readVariants(b, slug) {
  if (!Array.isArray(b.variants) || b.variants.length === 0) throw bad('Add at least one colour and size.', 'variants');
  const seen = new Set();
  return b.variants.map((v) => {
    const color = str(v.color, 'Colour', { max: 60 });
    const size = str(v.size, 'Size', { max: 10 }).toUpperCase();
    const key = `${color}/${size}`;
    if (seen.has(key)) throw bad(`${color} ${size} is listed twice.`, 'variants');
    seen.add(key);
    return {
      color, size,
      colorHex: v.colorHex ? str(v.colorHex, 'Colour code', { max: 9 }) : null,
      stock: int(v.stock ?? 0, 'Stock', { min: 0, max: 100000 }),
      sku: str(v.sku, 'SKU', { required: false })
        || `SV-${slug}-${color}-${size}`.toUpperCase().replace(/[^A-Z0-9]+/g, '-'),
    };
  });
}

exports.listProducts = wrap(async (req, res) => {
  const rows = await Product.findAll({ include: productInclude, order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']] });
  res.json({ products: rows.map(serialize) });
});

exports.createProduct = wrap(async (req, res) => {
  const data = readProduct(req.body);
  const variants = readVariants(req.body, data.slug);
  const catId = await categoryId(req.body.category);
  if (await Product.findOne({ where: { slug: data.slug } })) throw bad('A product with that name already exists.', 'name');
  const id = await sequelize.transaction(async (transaction) => {
    const p = await Product.create({ ...data, categoryId: catId }, { transaction });
    await ProductVariant.bulkCreate(variants.map((v) => ({ ...v, productId: p.id })), { transaction });
    return p.id;
  });
  res.status(201).json({ product: serialize(await Product.findByPk(id, { include: productInclude })) });
});

exports.updateProduct = wrap(async (req, res) => {
  const product = await Product.findByPk(req.params.id, { include: productInclude });
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  // Fields left out of the request keep their current value.
  const data = readProduct({ ...serialize(product), ...req.body });
  const clash = await Product.findOne({ where: { slug: data.slug, id: { [Op.ne]: product.id } } });
  if (clash) throw bad('Another product already uses that name.', 'name');
  const variants = req.body.variants ? readVariants({ variants: req.body.variants }, data.slug) : null;
  const catId = req.body.category ? await categoryId(req.body.category) : product.categoryId;

  await sequelize.transaction(async (transaction) => {
    await product.update({ ...data, categoryId: catId }, { transaction });
    if (!variants) return;
    const existing = await ProductVariant.findAll({ where: { productId: product.id }, transaction });
    const keep = new Set();
    for (const v of variants) {
      const match = existing.find((e) => e.color === v.color && e.size === v.size);
      if (match) {
        keep.add(match.id);
        await match.update({ colorHex: v.colorHex, stock: v.stock }, { transaction });
      } else {
        await ProductVariant.create({ ...v, productId: product.id }, { transaction });
      }
    }
    const stale = existing.filter((e) => !keep.has(e.id)).map((e) => e.id);
    if (stale.length) await ProductVariant.destroy({ where: { id: stale }, transaction });
  });
  res.json({ product: serialize(await Product.findByPk(product.id, { include: productInclude })) });
});

exports.deleteProduct = wrap(async (req, res) => {
  const n = await Product.destroy({ where: { id: req.params.id } });
  if (!n) return res.status(404).json({ message: 'Product not found.' });
  res.json({ ok: true });
});

exports.setStock = wrap(async (req, res) => {
  const v = await ProductVariant.findOne({ where: { sku: req.params.sku } });
  if (!v) return res.status(404).json({ message: 'Variant not found.' });
  await v.update({ stock: int(req.body.stock, 'Stock', { min: 0, max: 100000 }) });
  res.json({ sku: v.sku, stock: v.stock });
});

exports.listCategories = wrap(async (req, res) => {
  const rows = await Category.findAll({ order: [['sortOrder', 'ASC']] });
  res.json({ categories: rows.map((c) => ({ id: c.id, slug: c.slug, name: c.name })) });
});

/* ------------------------------- image upload ------------------------------ */

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
exports.UPLOAD_DIR = UPLOAD_DIR;

exports.upload = wrap(async (req, res) => {
  if (!req.file) throw bad('Choose an image to upload.');
  if (!/^image\/(png|jpeg|webp)$/.test(req.file.mimetype)) throw bad('Images must be PNG, JPG or WEBP.');

  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    const { v2: cloudinary } = require('cloudinary');
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const url = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'santo-veste' }, (err, r) => (err ? reject(err) : resolve(r.secure_url)))
        .end(req.file.buffer);
    });
    return res.status(201).json({ url });
  }

  // No Cloudinary configured: keep the file on this server so local development still works.
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[req.file.mimetype];
  const name = `${crypto.randomBytes(8).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), req.file.buffer);
  res.status(201).json({ url: `${req.protocol}://${req.get('host')}/uploads/${name}` });
});

/* ----------------------------- delivery & discounts ----------------------------- */

const feeOut = (r) => ({ id: r.id, state: r.state, zone: r.zone, fee: r.fee, estimate: r.estimate, isActive: r.isActive });

exports.listFees = wrap(async (req, res) => {
  res.json({ deliveryFees: (await DeliveryFee.findAll({ order: [['state', 'ASC']] })).map(feeOut) });
});

exports.saveFee = wrap(async (req, res) => {
  const b = req.body;
  const data = {
    state: str(b.state, 'State', { max: 60 }),
    zone: str(b.zone, 'Region', { max: 40, required: false }) || null,
    fee: int(b.fee, 'Delivery fee'),
    estimate: str(b.estimate, 'Estimate', { max: 40, required: false }) || null,
    isActive: b.isActive === undefined ? true : Boolean(b.isActive),
  };
  let row;
  if (req.params.id) {
    row = await DeliveryFee.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Delivery rate not found.' });
    await row.update(data);
  } else {
    row = await DeliveryFee.create(data);
  }
  res.status(req.params.id ? 200 : 201).json({ deliveryFee: feeOut(row) });
});

exports.deleteFee = wrap(async (req, res) => {
  await DeliveryFee.destroy({ where: { id: req.params.id } });
  res.json({ ok: true });
});

const discountOut = (d) => ({
  id: d.id, code: d.code, name: d.name, type: d.type, value: d.value, minSubtotal: d.minSubtotal,
  usageLimit: d.usageLimit, usedCount: d.usedCount, expiresAt: d.expiresAt, isActive: d.isActive,
});

exports.listDiscounts = wrap(async (req, res) => {
  res.json({ discounts: (await Discount.findAll({ order: [['createdAt', 'DESC']] })).map(discountOut) });
});

exports.saveDiscount = wrap(async (req, res) => {
  const b = req.body;
  const type = b.type === 'fixed' ? 'fixed' : 'percentage';
  const value = int(b.value, 'Value', { min: 1, max: type === 'percentage' ? 100 : 10000000 });
  const data = {
    code: str(b.code, 'Code', { max: 40 }).toUpperCase().replace(/\s+/g, ''),
    name: str(b.name, 'Name', { max: 120, required: false }) || null,
    type,
    value,
    minSubtotal: b.minSubtotal ? int(b.minSubtotal, 'Minimum spend') : 0,
    usageLimit: b.usageLimit ? int(b.usageLimit, 'Usage limit', { min: 1 }) : null,
    expiresAt: b.expiresAt ? new Date(b.expiresAt) : null,
    isActive: b.isActive === undefined ? true : Boolean(b.isActive),
  };
  let row;
  if (req.params.id) {
    row = await Discount.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Discount not found.' });
    await row.update(data);
  } else {
    if (await Discount.findOne({ where: { code: data.code } })) throw bad('That code already exists.', 'code');
    row = await Discount.create(data);
  }
  res.status(req.params.id ? 200 : 201).json({ discount: discountOut(row) });
});

exports.deleteDiscount = wrap(async (req, res) => {
  await Discount.destroy({ where: { id: req.params.id } });
  res.json({ ok: true });
});

/* ------------------------- customers & custom requests ------------------------- */

exports.listCustomers = wrap(async (req, res) => {
  const rows = await Order.findAll({
    where: { paymentStatus: 'paid' },
    attributes: [
      'email',
      [fn('MAX', col('customerName')), 'name'],
      [fn('MAX', col('phone')), 'phone'],
      [fn('COUNT', col('id')), 'orders'],
      [fn('SUM', col('total')), 'spent'],
      [fn('MIN', col('createdAt')), 'since'],
    ],
    group: ['email'],
    order: [[literal('"spent"'), 'DESC']],
    raw: true,
  });
  res.json({
    customers: rows.map((r) => ({
      email: r.email, name: r.name, phone: r.phone, orders: Number(r.orders), spent: Number(r.spent), since: r.since,
    })),
  });
});

exports.listCustomRequests = wrap(async (req, res) => {
  const where = req.query.status ? { status: req.query.status } : {};
  res.json({ requests: await CustomRequest.findAll({ where, order: [['createdAt', 'DESC']] }) });
});

exports.updateCustomRequest = wrap(async (req, res) => {
  const r = await CustomRequest.findByPk(req.params.id);
  if (!r) return res.status(404).json({ message: 'Request not found.' });
  const patch = {};
  if (req.body.status) {
    if (!['new', 'contacted', 'quoted', 'won', 'closed'].includes(req.body.status)) throw bad('Unknown status.');
    patch.status = req.body.status;
  }
  if (req.body.adminNote !== undefined) patch.adminNote = str(req.body.adminNote, 'Note', { max: 1000, required: false }) || null;
  await r.update(patch);
  res.json({ request: r });
});
