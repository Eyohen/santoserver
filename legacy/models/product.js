// models/product.js 
'use strict';
const { Model, UUIDV4 } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.Category, {
        foreignKey: 'categoryId',
        as: 'category'
      });
      Product.belongsTo(models.Brand, {
        foreignKey: 'brandId',
        as: 'brand'
      });
      Product.hasMany(models.Review, {
        foreignKey: 'productId',
        as: 'reviews'
      });
      Product.hasMany(models.OrderItem, {
        foreignKey: 'productId',
        as: 'orderItems'
      });
      Product.hasMany(models.Cart, {
        foreignKey: 'productId',
        as: 'cartItems'
      });
      Product.hasMany(models.Wishlist, {
        foreignKey: 'productId',
        as: 'wishlistItems'
      });
    }
  }

  Product.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    originalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Categories',
        key: 'id'
      }
    },
    brandId: {
      type: DataTypes.UUID,
      allowNull: true, // Make it optional for backward compatibility
      references: {
        model: 'Brands',
        key: 'id'
      }
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true
    },
    flavors: {
      type: DataTypes.JSON,
      allowNull: true
    },
    sizes: {
      type: DataTypes.JSON,
      allowNull: true
    },
    nutritionFacts: {
      type: DataTypes.JSON,
      allowNull: true
    },
    ingredients: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    flavour: {
      type: DataTypes.STRING,
      allowNull: true
    },
    stockQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    minStockLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 5
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    weight: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    dimensions: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Remove the old brand string field since we now have brandId
    sku: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    rating: {
      type: DataTypes.DECIMAL(2, 1),
      defaultValue: 0
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    salesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Product',
  });

  return Product;
};