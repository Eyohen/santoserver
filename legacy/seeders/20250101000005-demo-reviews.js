
// seeders/20250101000005-demo-reviews.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get users and products from database
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM "Users" WHERE "isAdmin" = false',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const products = await queryInterface.sequelize.query(
      'SELECT id FROM "Products"',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const reviews = [];
    const reviewTexts = [
      {
        title: 'Excellent Product!',
        comment: 'This protein powder is amazing! Great taste and excellent results. Highly recommend!',
        rating: 5
      },
      {
        title: 'Good Quality',
        comment: 'Really good quality product. Mixes well and tastes great. Will buy again.',
        rating: 4
      },
      {
        title: 'Love it!',
        comment: 'Been using this for months now. Excellent for muscle recovery after workouts.',
        rating: 5
      },
      {
        title: 'Great Value',
        comment: 'Good product for the price. Effective and tastes decent.',
        rating: 4
      },
      {
        title: 'Highly Effective',
        comment: 'Saw results within the first week. Excellent product quality.',
        rating: 5
      },
      {
        title: 'Pretty Good',
        comment: 'Does what it says. Good mixing and flavor options.',
        rating: 4
      }
    ];

    // Create reviews for each product
    products.forEach((product, productIndex) => {
      // Create 3-5 reviews per product
      const numReviews = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < numReviews; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomReview = reviewTexts[Math.floor(Math.random() * reviewTexts.length)];
        
        reviews.push({
          id: uuidv4(),
          userId: randomUser.id,
          productId: product.id,
          rating: randomReview.rating,
          title: randomReview.title,
          comment: randomReview.comment,
          isVerified: Math.random() > 0.3, // 70% chance of being verified
          isApproved: true,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Random date within last 30 days
          updatedAt: new Date()
        });
      }
    });

    await queryInterface.bulkInsert('Reviews', reviews);
    console.log('✅ Reviews seeded successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Reviews', null, {});
  }
};
