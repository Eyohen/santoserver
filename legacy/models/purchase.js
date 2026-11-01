'use strict';
const { Model, UUIDV4 } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Purchase extends Model {
    static associate(models) {
      Purchase.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }
  
  Purchase.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    fname: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    items: {
      type: DataTypes.JSON,  // This will store the array of items
      allowNull: false
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
      defaultValue: 'completed'
    }
  }, {
    sequelize,
    modelName: 'Purchase',
  });
  
  return Purchase;
};