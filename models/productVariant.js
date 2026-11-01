'use strict';
module.exports = (sequelize, DataTypes) => {
  const ProductVariant = sequelize.define('ProductVariant', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    productId: { type: DataTypes.UUID, allowNull: false },
    sku: { type: DataTypes.STRING, allowNull: false, unique: true },
    color: { type: DataTypes.STRING, allowNull: false },
    colorHex: DataTypes.STRING,
    size: { type: DataTypes.STRING, allowNull: false },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
  }, {
    indexes: [{ unique: true, fields: ['productId', 'color', 'size'] }],
  });
  ProductVariant.associate = (m) => ProductVariant.belongsTo(m.Product, { foreignKey: 'productId', as: 'product' });
  return ProductVariant;
};
