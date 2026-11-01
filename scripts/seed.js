'use strict';
// Usage: npm run seed
// Adds anything missing (categories, products, delivery rates, the admin user). Safe to re-run.
require('dotenv').config();
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const db = require('../models');

const { sequelize, User, Category, Product, ProductVariant, DeliveryFee } = db;

const ZONES = {
  'South-West': ['Ekiti', 'Lagos', 'Ogun', 'Ondo', 'Osun', 'Oyo'],
  'South-East': ['Abia', 'Anambra', 'Ebonyi', 'Enugu', 'Imo'],
  'South-South': ['Akwa Ibom', 'Bayelsa', 'Cross River', 'Delta', 'Edo', 'Rivers'],
  'North-Central': ['Abuja (FCT)', 'Benue', 'Kogi', 'Kwara', 'Nasarawa', 'Niger', 'Plateau'],
  'North-East': ['Adamawa', 'Bauchi', 'Borno', 'Gombe', 'Taraba', 'Yobe'],
  'North-West': ['Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Sokoto', 'Zamfara'],
};
// Starting rates only (the storefront's old placeholders). Edit them in Admin > Delivery.
const feeFor = (state) => (state === 'Lagos' ? 3000 : state === 'Abuja (FCT)' || state === 'Ogun' ? 4500 : 6000);

// The mock catalogue is an ES module inside the Vite app; load a copy of it as .mjs.
async function loadMock() {
  const src = path.join(__dirname, '..', '..', 'santo', 'src', 'data', 'products.mock.js');
  const tmp = path.join(os.tmpdir(), `sv-mock-${crypto.randomBytes(4).toString('hex')}.mjs`);
  fs.copyFileSync(src, tmp);
  try {
    return await import(`file://${tmp}`);
  } finally {
    fs.unlinkSync(tmp);
  }
}

(async () => {
  await sequelize.authenticate();
  await sequelize.sync();

  const { products, categories } = await loadMock();

  const catIds = {};
  for (const [i, c] of categories.entries()) {
    const [row] = await Category.findOrCreate({ where: { slug: c.slug }, defaults: { name: c.name, sortOrder: i } });
    catIds[c.slug] = row.id;
  }

  let created = 0;
  for (const [i, p] of products.entries()) {
    if (await Product.findOne({ where: { slug: p.slug } })) continue;
    const row = await Product.create({
      slug: p.slug, name: p.name, description: p.description, fabrics: p.fabrics, features: p.features,
      price: p.price, compareAtPrice: p.compareAtPrice, categoryId: catIds[p.category],
      images: p.images, imagesByColor: p.imagesByColor, isNew: p.isNew, sortOrder: i,
    });
    await ProductVariant.bulkCreate(p.variants.map((v) => ({
      productId: row.id, sku: v.sku, color: v.color, colorHex: v.colorHex, size: v.size, stock: v.stock,
    })));
    created += 1;
  }

  for (const [zone, states] of Object.entries(ZONES)) {
    for (const state of states) {
      await DeliveryFee.findOrCreate({
        where: { state },
        defaults: { zone, fee: feeFor(state), estimate: zone === 'South-West' ? '2-4 days' : '3-6 days' },
      });
    }
  }

  const email = (process.env.ADMIN_EMAIL || 'admin@santoveste.com').toLowerCase();
  if (!(await User.findOne({ where: { email } }))) {
    const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
    await User.create({ name: 'Santo Veste Admin', email, role: 'admin', passwordHash: await User.hash(password) });
    console.log(`Admin created: ${email} / ${password}${process.env.ADMIN_PASSWORD ? '' : '  (shown once, change it)'}`);
  }

  console.log(`Seeded ${created} new products, ${await DeliveryFee.count()} delivery states.`);
  await sequelize.close();
})().catch((err) => { console.error(err); process.exit(1); });
