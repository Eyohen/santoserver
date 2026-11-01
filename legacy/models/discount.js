// models/discount.js
'use strict';
const { Model, UUIDV4 } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Discount extends Model {
    static associate(models) {
      Discount.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator'
      });
      Discount.hasMany(models.Order, {
        foreignKey: 'discountId',
        as: 'orders'
      });
    }
  }

  Discount.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    code: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        len: [4, 20],
        isUppercase: true,
        isAlphanumeric: true
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM,
      values: ['percentage', 'fixed'],
      defaultValue: 'percentage'
    },
    value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    minOrderAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    maxDiscountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    usageLimit: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    usageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    userUsageLimit: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    validFrom: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    validUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Discount',
    hooks: {
      beforeCreate: (discount, options) => {
        // Auto-generate code if not provided
        if (!discount.code) {
          discount.code = generateDiscountCode();
        }
      }
    }
  });

  return Discount;
};

// Helper function to generate discount codes
function generateDiscountCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}