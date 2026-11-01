'use strict';
module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    fabrics: DataTypes.STRING,
    features: DataTypes.STRING,
    // Whole naira. Paystack amounts are derived as price * 100 (kobo).
    price: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } },
    compareAtPrice: DataTypes.INTEGER,
    categoryId: { type: DataTypes.UUID, allowNull: false },
    // Photos by colour name: { "Cream": ["https://..."], ... }. `images` is the default set.
    images: { type: DataTypes.JSONB, defaultValue: [] },
    imagesByColor: { type: DataTypes.JSONB, defaultValue: {} },
    isNew: { type: DataTypes.BOOLEAN, defaultValue: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
  });
  Product.associate = (m) => {
    Product.belongsTo(m.Category, { foreignKey: 'categoryId', as: 'categoryRef' });
    Product.hasMany(m.ProductVariant, { foreignKey: 'productId', as: 'variants', onDelete: 'CASCADE' });
  };
  return Product;
};
