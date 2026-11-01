// models/order.js 
'use strict';
const { Model, UUIDV4 } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      Order.hasMany(models.OrderItem, {
        foreignKey: 'orderId',
        as: 'orderItems'
      });
      Order.belongsTo(models.Address, {
        foreignKey: 'shippingAddressId',
        as: 'shippingAddress'
      });
      Order.hasOne(models.Payment, {
        foreignKey: 'orderId',
        as: 'payment'
      });
      Order.belongsTo(models.Discount, {
        foreignKey: 'discountId',
        as: 'discount'
      });
      Order.hasOne(models.DiscountUsage, {
        foreignKey: 'orderId',
        as: 'discountUsage'
      });
      Order.belongsTo(models.DeliveryFee, {
        foreignKey: 'deliveryFeeId',
        as: 'deliveryFee'
      });
    }
  }

  Order.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    orderNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true, // Allow null for guest checkout
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM,
      values: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      defaultValue: 'pending'
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    discountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Discounts',
        key: 'id'
      }
    },
    discountCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tax: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    shipping: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'NGN'
    },
    shippingAddressId: {
      type: DataTypes.UUID,
      allowNull: true, // Allow null for guest checkout
      references: {
        model: 'Addresses',
        key: 'id'
      }
    },
    trackingNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    shippedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    guestEmail: {
      type: DataTypes.STRING,
      allowNull: true // For guest orders
    },
    guestShippingInfo: {
      type: DataTypes.JSONB, // Store guest shipping details
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Order',
  });

  return Order;
};