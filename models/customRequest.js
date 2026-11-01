'use strict';
module.exports = (sequelize, DataTypes) => sequelize.define('CustomRequest', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  product: DataTypes.STRING,
  message: DataTypes.TEXT,
  status: { type: DataTypes.ENUM('new', 'contacted', 'quoted', 'won', 'closed'), defaultValue: 'new' },
  adminNote: DataTypes.TEXT,
});
