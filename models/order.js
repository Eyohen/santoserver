'use strict';
module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    orderNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    userId: DataTypes.UUID,
    // Fulfilment lifecycle. Payment is tracked separately in paymentStatus.
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'),
      defaultValue: 'pending',
    },
    paymentStatus: { type: DataTypes.ENUM('unpaid', 'paid', 'failed', 'refunded'), defaultValue: 'unpaid' },
    email: { type: DataTypes.STRING, allowNull: false },
    customerName: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    shippingAddress: { type: DataTypes.STRING, allowNull: false },
    shippingCity: { type: DataTypes.STRING, allowNull: false },
    shippingState: { type: DataTypes.STRING, allowNull: false },
    subtotal: { type: DataTypes.INTEGER, allowNull: false },
    discountAmount: { type: DataTypes.INTEGER, defaultValue: 0 },
    discountCode: DataTypes.STRING,
    shippingFee: { type: DataTypes.INTEGER, defaultValue: 0 },
    total: { type: DataTypes.INTEGER, allowNull: false },
    currency: { type: DataTypes.STRING, defaultValue: 'NGN' },
    // Paystack transaction reference, generated server-side at checkout.
    paymentReference: { type: DataTypes.STRING, unique: true },
    paidAt: DataTypes.DATE,
    stockDeducted: { type: DataTypes.BOOLEAN, defaultValue: false },
    trackingNumber: DataTypes.STRING,
    notes: DataTypes.TEXT,
    // Set when money was received but something needs a human (e.g. stock ran out).
    adminNote: DataTypes.TEXT,
  });
  Order.associate = (m) => {
    Order.belongsTo(m.User, { foreignKey: 'userId', as: 'user' });
    Order.hasMany(m.OrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' });
    Order.hasMany(m.Payment, { foreignKey: 'orderId', as: 'payments' });
  };
  return Order;
};
