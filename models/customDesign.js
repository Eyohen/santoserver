'use strict';
// A customer-made t-shirt design: the mockup they saw plus the print-ready artwork (transparent PNG).
module.exports = (sequelize, DataTypes) => sequelize.define('CustomDesign', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  previewUrl: { type: DataTypes.STRING(500), allowNull: false },
  artworkUrl: { type: DataTypes.STRING(500), allowNull: false },
  model: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'man' },
});
