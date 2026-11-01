
// models/wishlist.js
'use strict';
const { Model, UUIDV4 } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Wishlist extends Model {
    static associate(models) {
      Wishlist.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      Wishlist.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product'
      });
    }
  }

  Wishlist.init({
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
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Products',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Wishlist',
  });

  return Wishlist;
};
