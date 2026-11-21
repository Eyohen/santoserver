'use strict';
// A snapshot of the variant at purchase time, so later catalogue edits never rewrite history.
module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define('OrderItem', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    orderId: { type: DataTypes.UUID, allowNull: false },
    sku: { type: DataTypes.STRING, allowNull: false },
    productName: { type: DataTypes.STRING, allowNull: false },
    productSlug: DataTypes.STRING,
    color: DataTypes.STRING,
    size: DataTypes.STRING,
    image: DataTypes.STRING,
    // Custom t-shirt lines: the id and print-ready artwork of the customer's design.
    designId: DataTypes.UUID,
    artworkUrl: DataTypes.STRING(500),
    unitPrice: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    lineTotal: { type: DataTypes.INTEGER, allowNull: false },
  });
  OrderItem.associate = (m) => OrderItem.belongsTo(m.Order, { foreignKey: 'orderId', as: 'order' });
  return OrderItem;
};
