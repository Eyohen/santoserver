'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Change productId to allow NULL (for when product is deleted)
    await queryInterface.changeColumn('OrderItems', 'productId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Products',
        key: 'id'
      },
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert productId to NOT NULL
    await queryInterface.changeColumn('OrderItems', 'productId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'Products',
        key: 'id'
      }
    });
  }
};
