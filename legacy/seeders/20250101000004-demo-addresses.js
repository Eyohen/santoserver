
// seeders/20250101000004-demo-addresses.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get user IDs from the database
    const users = await queryInterface.sequelize.query(
      'SELECT id, email FROM "Users" WHERE "isAdmin" = false',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const addresses = [];
    
    // Create addresses for each user
    users.forEach((user, index) => {
      addresses.push(
        {
          id: uuidv4(),
          userId: user.id,
          type: 'home',
          firstName: 'John',
          lastName: 'Doe',
          phone: `+234 123 456 78${90 + index}`,
          streetAddress: `${123 + index} Main Street`,
          city: 'Lagos',
          state: 'Lagos State',
          zipCode: `10000${index + 1}`,
          country: 'Nigeria',
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          userId: user.id,
          type: 'work',
          firstName: 'John',
          lastName: 'Doe',
          phone: `+234 123 456 78${90 + index}`,
          streetAddress: `${456 + index} Business Avenue`,
          city: 'Lagos',
          state: 'Lagos State',
          zipCode: `10000${index + 2}`,
          country: 'Nigeria',
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      );
    });

    await queryInterface.bulkInsert('Addresses', addresses);
    console.log('✅ Addresses seeded successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Addresses', null, {});
  }
};