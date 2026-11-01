'use strict';
module.exports = (sequelize, DataTypes) => sequelize.define('DeliveryFee', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  state: { type: DataTypes.STRING, allowNull: false, unique: true },
  zone: DataTypes.STRING,
  fee: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  estimate: DataTypes.STRING,
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});
