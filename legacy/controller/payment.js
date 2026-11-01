
// controller/payment.js
const db = require('../models');
const { Payment, Order, OrderItem, Product, Discount, DiscountUsage, sequelize } = db;

const confirmPayment = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { orderId, paymentReference, paymentMethod = 'paystack' } = req.body;
    const userId = req.user ? req.user.id : null;

    // Get order details with order items
    const order = await Order.findOne({
      where: { id: orderId },
      include: [
        {
          model: OrderItem,
          as: 'orderItems'
        }
      ]
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify order belongs to user (if authenticated)
    if (userId && order.userId !== userId) {
      await transaction.rollback();
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check if payment is already confirmed
    const existingPayment = await Payment.findOne({ where: { orderId } });
    if (existingPayment && existingPayment.status === 'success') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Payment already confirmed' });
    }

    // Update stock for each order item
    for (const item of order.orderItems) {
      const product = await Product.findByPk(item.productId);

      if (!product) {
        await transaction.rollback();
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }

      // Check stock availability
      if (product.stockQuantity < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`
        });
      }

      // Update stock
      await product.update({
        stockQuantity: product.stockQuantity - item.quantity,
        salesCount: product.salesCount + item.quantity
      }, { transaction });
    }

    // Record discount usage if discount was applied
    if (order.discountId) {
      const discount = await Discount.findByPk(order.discountId);

      if (discount) {
        // Create discount usage record
        await DiscountUsage.create({
          discountId: order.discountId,
          userId: order.userId || null,
          orderId: order.id,
          discountAmount: order.discountAmount,
          originalAmount: order.subtotal,
          finalAmount: order.total
        }, { transaction });

        // Update discount usage count
        await discount.update({
          usageCount: discount.usageCount + 1
        }, { transaction });
      }
    }

    // Update payment record
    await Payment.update({
      paystackReference: paymentReference,
      status: 'success',
      transactionId: paymentReference,
      paidAt: new Date()
    }, { where: { orderId }, transaction });

    // Update order status to processing
    await Order.update({
      status: 'processing'
    }, { where: { id: orderId }, transaction });

    await transaction.commit();

    res.json({
      message: 'Payment confirmed successfully',
      order
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Payment confirmation error:', error);
    res.status(500).json({ message: 'Payment confirmation failed', error: error.message });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId, status, paymentReference } = req.body;
    const userId = req.user.id;

    // Get order details
    const order = await Order.findOne({ where: { id: orderId, userId } });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update payment record
    await Payment.update({
      status,
      paystackReference: paymentReference,
      paidAt: status === 'success' ? new Date() : null
    }, { where: { orderId } });

    // Update order status based on payment status
    let orderStatus = 'pending';
    if (status === 'success') {
      orderStatus = 'processing';
    } else if (status === 'failed') {
      orderStatus = 'cancelled';
    }

    await Order.update({ status: orderStatus }, { where: { id: orderId } });

    res.json({
      message: 'Payment status updated successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Payment status update failed', error: error.message });
  }
};

const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const payment = await Payment.findOne({
      where: { orderId },
      include: [
        {
          model: Order,
          as: 'order',
          where: { userId }
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({ payment });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get payment status', error: error.message });
  }
};

module.exports = { confirmPayment, updatePaymentStatus, getPaymentStatus };