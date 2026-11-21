'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const db = require('./models');
const routes = require('./routes');
const webhook = require('./controllers/webhook');
const { errorHandler } = require('./middleware/http');
const { UPLOAD_DIR } = require('./controllers/admin');

const app = express();
const port = process.env.API_PORT || 9000;

const { origins } = require('./config/frontend');
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: origins, credentials: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Keep the raw bytes: Paystack's webhook signature is computed over them.
app.use(express.json({ limit: '1mb', verify: (req, res, buf) => { req.rawBody = buf; } }));

app.post('/api/webhooks/paystack', webhook.paystack);
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/api', routes);
app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use(errorHandler);

async function start() {
  await db.sequelize.authenticate();
  await db.sequelize.sync(); // creates missing tables; use `npm run seed -- --reset` to rebuild
  // sync() never alters existing tables, so add the discount columns to a database created before them.
  await db.sequelize.query('ALTER TABLE "Products" ADD COLUMN IF NOT EXISTS "discountType" VARCHAR(10), ADD COLUMN IF NOT EXISTS "discountValue" INTEGER');
  await db.sequelize.query('ALTER TABLE "OrderItems" ADD COLUMN IF NOT EXISTS "designId" UUID, ADD COLUMN IF NOT EXISTS "artworkUrl" VARCHAR(500)');
  // Discounts once stored as "naira off" ('amount') are now "discounted price": convert them, or clear any that can't be.
  await db.sequelize.query('UPDATE "Products" SET "discountValue" = "price" - "discountValue", "discountType" = \'price\' WHERE "discountType" = \'amount\' AND "discountValue" > 0 AND "discountValue" < "price"');
  await db.sequelize.query('UPDATE "Products" SET "discountType" = NULL, "discountValue" = NULL WHERE "discountType" = \'amount\'');
  // First run only: turn the original hero photos into editable slides so the admin can reorder, replace or delete them.
  if (!(await db.HeroSlide.count())) {
    await db.HeroSlide.bulkCreate([
      { imageUrl: '/brand/photo/hero-stairs.webp', focusX: 60, focusY: 40, alt: 'A man in a black corduroy shirt-jacket and cream trousers sits on pale concrete steps under a blue sky' },
      { imageUrl: '/brand/photo/pair-arch.webp', focusX: 40, focusY: 30, alt: 'A man and a woman in stone-coloured tees stand in front of an arched wall' },
      { imageUrl: '/brand/photo/man-looking-up.webp', focusX: 50, focusY: 30, alt: 'A man in a stone-coloured jacket and white tee looks up, lit by warm sun against curved concrete' },
      { imageUrl: '/brand/photo/pink-corduroy.webp', focusX: 50, focusY: 25, alt: 'A man in a pink corduroy jacket and cream trousers looks down at the camera' },
      { imageUrl: '/brand/photo/woman-black-tee.webp', focusX: 50, focusY: 25, alt: 'A woman in sunglasses and a black tee, lit by warm sun' },
    ].map((s, i) => ({ ...s, sortOrder: i })));
  }
  app.listen(port, () => console.log(`Santo Veste API on http://localhost:${port}/api`));
}

if (require.main === module) {
  start().catch((err) => { console.error('Failed to start:', err.message); process.exit(1); });
}

module.exports = { app, start };
