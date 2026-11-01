
// models/user.js
'use strict';
const { Model, UUIDV4 } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Order, {
        foreignKey: 'userId',
        as: 'orders'
      });
      User.hasMany(models.Review, {
        foreignKey: 'userId',
        as: 'reviews'
      });
      User.hasMany(models.Cart, {
        foreignKey: 'userId',
        as: 'cartItems'
      });
      User.hasMany(models.Address, {
        foreignKey: 'userId',
        as: 'addresses'
      });
      User.hasMany(models.Wishlist, {
        foreignKey: 'userId',
        as: 'wishlistItems'
      });
    }

    async validatePassword(password) {
      return await bcrypt.compare(password, this.password);
    }
  }

  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    verificationToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });

  return User;
};