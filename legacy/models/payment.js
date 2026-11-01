
// models/payment.js
'use strict';
const { Model, UUIDV4 } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      Payment.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order'
      });
      Payment.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  Payment.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Orders',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    paymentMethod: {
      type: DataTypes.ENUM,
      values: ['paystack', 'card', 'bank_transfer'],
      allowNull: false
    },
    paystackReference: {
      type: DataTypes.STRING,
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },
    status: {
      type: DataTypes.ENUM,
      values: ['pending', 'success', 'failed', 'cancelled'],
      defaultValue: 'pending'
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    gateway: {
      type: DataTypes.STRING,
      defaultValue: 'paystack'
    },
    gatewayResponse: {
      type: DataTypes.JSON,
      allowNull: true
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Payment',
  });

  return Payment;
};