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
  app.listen(port, () => console.log(`Santo Veste API on http://localhost:${port}/api`));
}

if (require.main === module) {
  start().catch((err) => { console.error('Failed to start:', err.message); process.exit(1); });
}

module.exports = { app, start };
