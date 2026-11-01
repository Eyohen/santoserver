const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create categories
    const categories = [
      {
        id: uuidv4(),
        name: 'Whey Protein',
        description: 'High-quality whey protein supplements',
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop',
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Mass Gainers',
        description: 'Build muscle mass effectively',
        imageUrl: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=300&h=300&fit=crop',
        isActive: true,
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Creatine',
        description: 'Boost your performance',
        imageUrl: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=300&h=300&fit=crop',
        isActive: true,
        sortOrder: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Pre Workout',
        description: 'Energy for your workouts',
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop',
        isActive: true,
        sortOrder: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Meal Replacement',
        description: 'Complete nutrition on-the-go',
        imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=300&fit=crop',
        isActive: true,
        sortOrder: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('Categories', categories);

    // Create admin user
    const adminUser = {
      id: uuidv4(),
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@hopg.com',
      password: await bcrypt.hash('password123', 10),
      phone: '+1234567890',
      isAdmin: true,
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await queryInterface.bulkInsert('Users', [adminUser]);

    // Create sample products
    const products = [
      {
        id: uuidv4(),
        name: 'Premium Whey Isolate',
        description: 'Our Premium Whey Isolate delivers 25g of pure protein per serving with minimal carbs and fats.',
        price: 49.99,
        originalPrice: 59.99,
        categoryId: categories[0].id,
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
        flavors: JSON.stringify(['Chocolate', 'Vanilla', 'Strawberry', 'Cookies & Cream']),
        sizes: JSON.stringify([
          { size: '1 lb', price: 29.99, originalPrice: 34.99 },
          { size: '2.5 lbs', price: 49.99, originalPrice: 59.99 },
          { size: '5 lbs', price: 89.99, originalPrice: 109.99 }
        ]),
        stockQuantity: 100,
        brand: 'HOPG Premium',
        sku: 'HOPG-WPI-001',
        isFeatured: true,
        rating: 4.8,
        reviewCount: 324,
        salesCount: 1250,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Mass Gainer Pro 5000',
        description: 'High-calorie mass gainer with 50g protein and complex carbohydrates for serious muscle building.',
        price: 89.99,
        originalPrice: 109.99,
        categoryId: categories[1].id,
        imageUrl: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&h=400&fit=crop',
        flavors: JSON.stringify(['Chocolate', 'Vanilla', 'Strawberry']),
        sizes: JSON.stringify([
          { size: '5 lbs', price: 89.99, originalPrice: 109.99 },
          { size: '10 lbs', price: 159.99, originalPrice: 199.99 }
        ]),
        stockQuantity: 50,
        brand: 'HOPG Gold',
        sku: 'HOPG-MG-002',
        isFeatured: true,
        rating: 4.9,
        reviewCount: 189,
        salesCount: 850,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Pure Creatine Monohydrate',
        description: 'Micronized creatine monohydrate for improved strength, power, and muscle mass.',
        price: 24.99,
        originalPrice: 29.99,
        categoryId: categories[2].id,
        imageUrl: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=400&fit=crop',
        flavors: JSON.stringify(['Unflavored', 'Fruit Punch']),
        sizes: JSON.stringify([
          { size: '1 lb', price: 24.99, originalPrice: 29.99 },
          { size: '2 lbs', price: 44.99, originalPrice: 54.99 }
        ]),
        stockQuantity: 200,
        brand: 'HOPG Premium',
        sku: 'HOPG-CR-003',
        isFeatured: true,
        rating: 4.7,
        reviewCount: 256,
        salesCount: 2100,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('Products', products);

    console.log('✅ Demo data seeded successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Products', null, {});
    await queryInterface.bulkDelete('Categories', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  }
};
