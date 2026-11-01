'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const categories = [
      {
        id: uuidv4(),
        name: 'Whey Protein',
        description: 'High-quality whey protein supplements for muscle building and recovery',
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop',
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Mass Gainers',
        description: 'High-calorie supplements designed to help you build muscle mass effectively',
        imageUrl: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=300&h=300&fit=crop',
        isActive: true,
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Creatine',
        description: 'Boost your performance and strength with premium creatine supplements',
        imageUrl: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=300&h=300&fit=crop',
        isActive: true,
        sortOrder: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Pre Workout',
        description: 'Get energized for your workouts with our pre-workout supplements',
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop',
        isActive: true,
        sortOrder: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Meal Replacement',
        description: 'Complete nutrition on-the-go with our meal replacement shakes',
        imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=300&fit=crop',
        isActive: true,
        sortOrder: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('Categories', categories);
    
    // Store category IDs for use in products seeder
    global.categoryIds = categories.map(cat => ({ name: cat.name, id: cat.id }));
    
    console.log('✅ Categories seeded successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Categories', null, {});
  }
};
