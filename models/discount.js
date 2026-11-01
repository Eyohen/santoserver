'use strict';
module.exports = (sequelize, DataTypes) => sequelize.define('Discount', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: DataTypes.STRING,
  type: { type: DataTypes.ENUM('percentage', 'fixed'), allowNull: false },
  value: { type: DataTypes.INTEGER, allowNull: false },
  minSubtotal: { type: DataTypes.INTEGER, defaultValue: 0 },
  usageLimit: DataTypes.INTEGER,
  usedCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  expiresAt: DataTypes.DATE,
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});
