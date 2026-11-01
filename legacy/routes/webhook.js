// routes/webhook.js
const express = require('express');
const { handlePaystackWebhook } = require('../controller/webhook');

const router = express.Router();

// Paystack webhook endpoint
// Note: This route needs raw body for signature verification
// The raw body middleware is applied in index.js
router.post('/paystack', handlePaystackWebhook);

module.exports = router;
