
// models/address.js
'use strict';
const { Model, UUIDV4 } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Address extends Model {
    static associate(models) {
      Address.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      Address.hasMany(models.Order, {
        foreignKey: 'shippingAddressId',
        as: 'orders'
      });
    }
  }

  Address.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM,
      values: ['home', 'work', 'other'],
      defaultValue: 'home'
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    streetAddress: {
      type: DataTypes.STRING,
      allowNull: false
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false
    },
    zipCode: {
      type: DataTypes.STRING,
      allowNull: false
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'United States'
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Address',
  });

  return Address;
};