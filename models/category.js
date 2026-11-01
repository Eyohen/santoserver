'use strict';
module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
  });
  Category.associate = (m) => Category.hasMany(m.Product, { foreignKey: 'categoryId', as: 'products' });
  return Category;
};
