
// models/review.js
'use strict';
const { Model, UUIDV4 } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    static associate(models) {
      Review.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      Review.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product'
      });
    }
  }

  Review.init({
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
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isApproved: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Review',
  });

  return Review;
};