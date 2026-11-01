'use strict';
// Runs against a throwaway database and a stubbed Paystack, never real money.
require('dotenv').config();
process.env.DB_NAME = 'santo-veste-test';
process.env.PAYSTACK_SECRET_KEY = 'sk_test_unit';
process.env.JWT_SECRET = 'test-secret';
process.env.FRONTEND_URL = 'http://localhost:5173';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const http = require('http');
const { Client } = require('pg');

let db; let server; let base;
const paystackTx = {}; // reference -> what the fake Paystack will report

async function ensureDatabase() {
  const c = new Client({
    host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: 'postgres',
  });
  await c.connect();
  const { rowCount } = await c.query('select 1 from pg_database where datname = $1', [process.env.DB_NAME]);
  if (!rowCount) await c.query(`create database "${process.env.DB_NAME}"`);
  await c.end();
}

const realFetch = global.fetch;
global.fetch = async (url, opts = {}) => {
  const u = String(url);
  if (!u.startsWith('https://api.paystack.co')) return realFetch(url, opts);
  const json = (data) => ({ ok: true, json: async () => ({ status: true, data }) });
  if (u.endsWith('/transaction/initialize')) {
    const b = JSON.parse(opts.body);
    paystackTx[b.reference] = { amount: b.amount, currency: 'NGN' };
    return json({ access_code: `ac_${b.reference}`, authorization_url: 'https://checkout.paystack.com/x', reference: b.reference });
  }
  const ref = decodeURIComponent(u.split('/verify/')[1]);
  const t = paystackTx[ref];
  return json({ id: 123, reference: ref, status: t.status || 'success', amount: t.amount, currency: t.currency, channel: 'card', paid_at: new Date().toISOString() });
};

const call = (method, path, body, headers = {}) => new Promise((resolve, reject) => {
  const raw = body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body));
  const req = http.request(base + path, { method, headers: { 'content-type': 'application/json', ...headers } }, (res) => {
    let d = ''; res.on('data', (c) => { d += c; });
    res.on('end', () => {
      let parsed = null;
      try { parsed = d ? JSON.parse(d) : null; } catch { parsed = d; }
      resolve({ status: res.statusCode, body: parsed });
    });
  });
  req.on('error', reject);
  if (raw) req.write(raw);
  req.end();
});

const customer = { email: 'a@b.com', name: 'Ada', phone: '08031234567', address: '1 Road', city: 'Ikeja', state: 'Lagos' };
let sku;

test.before(async () => {
  await ensureDatabase();
  db = require('../models');
  await db.sequelize.sync({ force: true });
  const cat = await db.Category.create({ slug: 'polos', name: 'Polos' });
  const p = await db.Product.create({ slug: 'p', name: 'Polo', price: 20000, categoryId: cat.id, images: ['/a.webp'] });
  const v = await db.ProductVariant.create({ productId: p.id, sku: 'SV-1', color: 'Cream', size: 'M', stock: 3 });
  sku = v.sku;
  await db.DeliveryFee.create({ state: 'Lagos', fee: 3000 });
  await db.Discount.create({ code: 'TEN', type: 'percentage', value: 10 });
  const { app } = require('../server');
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});

test.after(async () => { server.close(); await db.sequelize.close(); });

const stock = async () => (await db.ProductVariant.findOne({ where: { sku } })).stock;

test('server prices the cart, ignoring any client-sent price', async () => {
  const r = await call('POST', '/checkout', { ...customer, items: [{ sku, qty: 2, price: 1 }], discountCode: 'ten' });
  assert.equal(r.status, 201);
  assert.equal(r.body.total, 40000 - 4000 + 3000);
  assert.equal(paystackTx[r.body.reference].amount, 3900000); // kobo
  assert.equal(await stock(), 3, 'stock is untouched until payment');
});

test('verify marks paid, deducts stock once, and is idempotent', async () => {
  const c = await call('POST', '/checkout', { ...customer, items: [{ sku, qty: 2 }] });
  const first = await call('POST', '/payments/verify', { reference: c.body.reference });
  assert.equal(first.body.order.paymentStatus, 'paid');
  assert.equal(first.body.order.status, 'processing');
  assert.equal(await stock(), 1);
  await call('POST', '/payments/verify', { reference: c.body.reference });
  assert.equal(await stock(), 1, 'second verify must not deduct again');
});

test('rejects quantities above stock', async () => {
  const r = await call('POST', '/checkout', { ...customer, items: [{ sku, qty: 5 }] });
  assert.equal(r.status, 409);
});

test('amount mismatch is not accepted as paid', async () => {
  const c = await call('POST', '/checkout', { ...customer, items: [{ sku, qty: 1 }] });
  paystackTx[c.body.reference].amount = 100;
  const r = await call('POST', '/payments/verify', { reference: c.body.reference });
  assert.equal(r.body.order.paymentStatus, 'failed');
  assert.equal(await stock(), 1);
});

test('webhook: bad signature rejected, valid one finalises', async () => {
  const c = await call('POST', '/checkout', { ...customer, items: [{ sku, qty: 1 }] });
  const body = JSON.stringify({ event: 'charge.success', data: { reference: c.body.reference } });
  const sig = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(body).digest('hex');
  const url = '/webhooks/paystack';
  const rejected = await call('POST', url, body, { 'x-paystack-signature': 'nope' });
  assert.equal(rejected.status, 401);
  const ok = await call('POST', url, body, { 'x-paystack-signature': sig });
  assert.equal(ok.status, 200);
  await new Promise((r) => setTimeout(r, 400));
  const order = await db.Order.findOne({ where: { paymentReference: c.body.reference } });
  assert.equal(order.paymentStatus, 'paid');
  assert.equal(await stock(), 0);
});

test('paid-but-oversold order is flagged, not lost', async () => {
  await db.ProductVariant.update({ stock: 1 }, { where: { sku } });
  const a = await call('POST', '/checkout', { ...customer, items: [{ sku, qty: 1 }] });
  const b = await call('POST', '/checkout', { ...customer, email: 'c@d.com', items: [{ sku, qty: 1 }] });
  await call('POST', '/payments/verify', { reference: a.body.reference });
  const r = await call('POST', '/payments/verify', { reference: b.body.reference });
  assert.equal(r.body.order.paymentStatus, 'paid');
  const o = await db.Order.findOne({ where: { paymentReference: b.body.reference } });
  assert.match(o.adminNote, /SHORT ON STOCK/);
  assert.equal(await stock(), 0);
});

test('admin routes require an admin token', async () => {
  assert.equal((await call('GET', '/admin/stats')).status, 401);
  const user = await db.User.create({ name: 'U', email: 'u@x.com', passwordHash: await db.User.hash('password1') });
  const login = await call('POST', '/auth/login', { email: 'u@x.com', password: 'password1' });
  assert.equal(login.status, 200);
  assert.equal((await call('GET', '/admin/stats', undefined, { authorization: `Bearer ${login.body.token}` })).status, 403);
  await user.update({ role: 'admin' });
  const stats = await call('GET', '/admin/stats', undefined, { authorization: `Bearer ${login.body.token}` });
  assert.equal(stats.status, 200);
  assert.ok(stats.body.paidOrders >= 3);
});
