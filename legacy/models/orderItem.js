
// models/orderItem.js
'use strict';
const { Model, UUIDV4 } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OrderItem extends Model {
    static associate(models) {
      OrderItem.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order'
      });
      OrderItem.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product'
      });
    }
  }

  OrderItem.init({
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
    productId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Products',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    selectedFlavor: {
      type: DataTypes.STRING,
      allowNull: true
    },
    selectedSize: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'OrderItem',
  });

  return OrderItem;
};