'use strict';
const paystack = require('../services/paystack');
const orders = require('../services/orders');
const { Order } = require('../models');

/**
 * Paystack calls this when a payment settles, even if the shopper closed the tab.
 * We re-verify with Paystack instead of trusting the payload.
 */
exports.paystack = async (req, res) => {
  if (!paystack.isValidSignature(req.rawBody, req.headers['x-paystack-signature'])) {
    return res.status(401).json({ message: 'Invalid signature' });
  }
  // Acknowledge fast; Paystack retries on non-200.
  res.sendStatus(200);

  try {
    const { event, data } = req.body;
    if (event !== 'charge.success' || !data?.reference) return;
    const order = await Order.findOne({ where: { paymentReference: data.reference } });
    if (order && order.paymentStatus !== 'paid') await orders.verifyAndFinalize(data.reference);
  } catch (err) {
    console.error('[webhook] failed:', err.message);
  }
};
