'use strict';
module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    orderId: { type: DataTypes.UUID, allowNull: false },
    reference: { type: DataTypes.STRING, allowNull: false, unique: true },
    gateway: { type: DataTypes.STRING, defaultValue: 'paystack' },
    channel: DataTypes.STRING,
    amount: { type: DataTypes.INTEGER, allowNull: false },
    currency: { type: DataTypes.STRING, defaultValue: 'NGN' },
    status: { type: DataTypes.ENUM('pending', 'success', 'failed', 'refunded'), defaultValue: 'pending' },
    gatewayTransactionId: DataTypes.STRING,
    gatewayResponse: DataTypes.JSONB,
    paidAt: DataTypes.DATE,
  });
  Payment.associate = (m) => Payment.belongsTo(m.Order, { foreignKey: 'orderId', as: 'order' });
  return Payment;
};
