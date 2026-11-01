'use strict';
const { Model, UUIDV4 } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DeliveryFee extends Model {
    static associate(models) {
      // DeliveryFee can be associated with Orders if needed
      DeliveryFee.hasMany(models.Order, {
        foreignKey: 'deliveryFeeId',
        as: 'orders'
      });
    }
  }

  DeliveryFee.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    zone: {
      type: DataTypes.ENUM('North-Central', 'North-East', 'North-West', 'South-East', 'South-South', 'South-West'),
      allowNull: true
    },
    estimatedDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Estimated delivery days'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'DeliveryFee',
    indexes: [
      {
        unique: true,
        fields: ['state']
      }
    ]
  });

  return DeliveryFee;
};