
// seeders/20250101000002-demo-users.js
'use strict';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const users = [
      {
        id: uuidv4(),
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@hopg.com',
        password: await bcrypt.hash('password123', 10),
        phone: '+234 123 456 7890',
        isAdmin: true,
        isActive: true,
        emailVerified: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: await bcrypt.hash('password123', 10),
        phone: '+234 123 456 7891',
        isAdmin: false,
        isActive: true,
        emailVerified: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: await bcrypt.hash('password123', 10),
        phone: '+234 123 456 7892',
        isAdmin: false,
        isActive: true,
        emailVerified: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike@example.com',
        password: await bcrypt.hash('password123', 10),
        phone: '+234 123 456 7893',
        isAdmin: false,
        isActive: true,
        emailVerified: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('Users', users);
    
    // Store user IDs for use in other seeders
    global.userIds = users.map(user => ({ email: user.email, id: user.id }));
    
    console.log('✅ Users seeded successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
