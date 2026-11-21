'use strict';
// A photograph in the landing-page hero slideshow. focusX/focusY (0-100) decide which part stays in view when the photo is cropped.
module.exports = (sequelize, DataTypes) => sequelize.define('HeroSlide', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  imageUrl: { type: DataTypes.STRING(500), allowNull: false },
  alt: { type: DataTypes.STRING(300), allowNull: false, defaultValue: '' },
  focusX: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 50 },
  focusY: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 30 },
  sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});
