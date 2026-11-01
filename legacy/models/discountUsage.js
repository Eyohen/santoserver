// models/discountUsage.js
'use strict';
const { Model, UUIDV4 } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DiscountUsage extends Model {
    static associate(models) {
      DiscountUsage.belongsTo(models.Discount, {
        foreignKey: 'discountId',
        as: 'discount'
      });
      DiscountUsage.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      DiscountUsage.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order'
      });
    }
  }

  DiscountUsage.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    discountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Discounts',
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
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Orders',
        key: 'id'
      }
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    originalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    finalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'DiscountUsage',
    indexes: [
      {
        unique: false,
        fields: ['discountId', 'userId']
      }
    ]
  });

  return DiscountUsage;
};