// controller/webhook.js
const crypto = require('crypto');
const db = require('../models');
const { Payment, Order, OrderItem, Product, Discount, DiscountUsage, sequelize } = db;

/**
 * Verify Paystack webhook signature
 */
const verifyPaystackSignature = (payload, signature) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error('PAYSTACK_SECRET_KEY not configured');
    return false;
  }

  const hash = crypto
    .createHmac('sha512', secret)
    .update(payload)
    .digest('hex');

  return hash === signature;
};

/**
 * Verify payment with Paystack API
 */
const verifyPaymentWithPaystack = async (reference) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    throw new Error('PAYSTACK_SECRET_KEY not configured');
  }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${secret}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to verify payment with Paystack');
  }

  return data;
};

/**
 * Process successful payment - updates order status, stock, etc.
 */
const processSuccessfulPayment = async (paymentReference, paystackData) => {
  const transaction = await sequelize.transaction();

  try {
    // Find payment by reference
    let payment = await Payment.findOne({
      where: { paystackReference: paymentReference }
    });

    // If not found by paystackReference, try to find by order number in reference
    // Reference format is typically: orderNumber-timestamp
    if (!payment) {
      const orderNumber = paymentReference.split('-')[0];
      const order = await Order.findOne({ where: { orderNumber } });
      if (order) {
        payment = await Payment.findOne({ where: { orderId: order.id } });
      }
    }

    if (!payment) {
      console.log(`Payment not found for reference: ${paymentReference}`);
      await transaction.rollback();
      return { success: false, message: 'Payment record not found' };
    }

    // Check if already processed
    if (payment.status === 'success') {
      console.log(`Payment ${paymentReference} already processed`);
      await transaction.rollback();
      return { success: true, message: 'Payment already processed' };
    }

    // Get order with items
    const order = await Order.findOne({
      where: { id: payment.orderId },
      include: [{ model: OrderItem, as: 'orderItems' }]
    });

    if (!order) {
      console.error(`Order not found for payment: ${paymentReference}`);
      await transaction.rollback();
      return { success: false, message: 'Order not found' };
    }

    // Verify amount matches (Paystack sends amount in kobo)
    const expectedAmount = Math.round(order.total * 100);
    if (paystackData.data.amount !== expectedAmount) {
      console.error(`Amount mismatch for ${paymentReference}: expected ${expectedAmount}, got ${paystackData.data.amount}`);
      // Log but don't fail - could be rounding differences
    }

    // Update stock for each order item
    for (const item of order.orderItems) {
      const product = await Product.findByPk(item.productId, { transaction });

      if (!product) {
        console.error(`Product ${item.productId} not found during webhook processing`);
        continue;
      }

      // Check stock availability
      if (product.stockQuantity < item.quantity) {
        console.warn(`Insufficient stock for ${product.name} during webhook processing`);
        // Continue anyway since payment is already made
      }

      // Update stock
      await product.update({
        stockQuantity: Math.max(0, product.stockQuantity - item.quantity),
        salesCount: product.salesCount + item.quantity
      }, { transaction });
    }

    // Record discount usage if discount was applied
    if (order.discountId) {
      const discount = await Discount.findByPk(order.discountId, { transaction });

      if (discount) {
        // Check if discount usage already recorded
        const existingUsage = await DiscountUsage.findOne({
          where: { orderId: order.id },
          transaction
        });

        if (!existingUsage) {
          await DiscountUsage.create({
            discountId: order.discountId,
            userId: order.userId || null,
            orderId: order.id,
            discountAmount: order.discountAmount,
            originalAmount: order.subtotal,
            finalAmount: order.total
          }, { transaction });

          await discount.update({
            usageCount: discount.usageCount + 1
          }, { transaction });
        }
      }
    }

    // Update payment record
    await Payment.update({
      paystackReference: paymentReference,
      status: 'success',
      transactionId: paystackData.data.id?.toString() || paymentReference,
      paidAt: new Date(paystackData.data.paid_at || Date.now())
    }, { where: { id: payment.id }, transaction });

    // Update order status to processing
    await Order.update({
      status: 'processing'
    }, { where: { id: order.id }, transaction });

    await transaction.commit();

    console.log(`Successfully processed payment ${paymentReference} for order ${order.orderNumber}`);
    return { success: true, message: 'Payment processed successfully' };

  } catch (error) {
    await transaction.rollback();
    console.error('Error processing payment:', error);
    throw error;
  }
};

/**
 * Handle Paystack webhook events
 */
const handlePaystackWebhook = async (req, res) => {
  try {
    // Get the signature from headers
    const signature = req.headers['x-paystack-signature'];

    if (!signature) {
      console.error('Missing Paystack signature');
      return res.status(401).json({ message: 'Missing signature' });
    }

    // Get raw body for signature verification
    const payload = req.rawBody || JSON.stringify(req.body);

    // Verify signature
    if (!verifyPaystackSignature(payload, signature)) {
      console.error('Invalid Paystack signature');
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const event = req.body;
    console.log(`Received Paystack webhook: ${event.event}`);

    // Handle different event types
    switch (event.event) {
      case 'charge.success': {
        const reference = event.data.reference;

        // Verify the payment with Paystack API for extra security
        const verification = await verifyPaymentWithPaystack(reference);

        if (verification.data.status !== 'success') {
          console.error(`Payment verification failed for ${reference}: ${verification.data.status}`);
          return res.status(400).json({ message: 'Payment verification failed' });
        }

        // Process the successful payment
        const result = await processSuccessfulPayment(reference, verification);

        if (result.success) {
          return res.status(200).json({ message: result.message });
        } else {
          return res.status(400).json({ message: result.message });
        }
      }

      case 'charge.failed': {
        const reference = event.data.reference;
        console.log(`Payment failed for reference: ${reference}`);

        // Find and update the payment/order status
        const orderNumber = reference.split('-')[0];
        const order = await Order.findOne({ where: { orderNumber } });

        if (order) {
          await Payment.update(
            { status: 'failed' },
            { where: { orderId: order.id } }
          );
          await Order.update(
            { status: 'cancelled' },
            { where: { id: order.id } }
          );
        }

        return res.status(200).json({ message: 'Failure recorded' });
      }

      default:
        console.log(`Unhandled Paystack event: ${event.event}`);
        return res.status(200).json({ message: 'Event received' });
    }

  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 to prevent Paystack from retrying
    return res.status(200).json({ message: 'Webhook received with errors' });
  }
};

module.exports = {
  handlePaystackWebhook,
  verifyPaymentWithPaystack,
  processSuccessfulPayment
};
