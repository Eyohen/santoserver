
// seeders/20250101000003-demo-products.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get category IDs from the previous seeder
    const categories = await queryInterface.sequelize.query(
      'SELECT id, name FROM "Categories" ORDER BY "sortOrder"',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const products = [
      {
        id: uuidv4(),
        name: 'Premium Whey Isolate',
        description: 'Our Premium Whey Isolate delivers 25g of pure protein per serving with minimal carbs and fats. Perfect for post-workout recovery and muscle building. Made from grass-fed cows and contains all essential amino acids your body needs.',
        price: 49.99,
        originalPrice: 59.99,
        categoryId: categories.find(cat => cat.name === 'Whey Protein').id,
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
          'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&h=400&fit=crop'
        ]),
        flavors: JSON.stringify(['Chocolate', 'Vanilla', 'Strawberry', 'Cookies & Cream']),
        sizes: JSON.stringify([
          { size: '1 lb', price: 29.99, originalPrice: 34.99 },
          { size: '2.5 lbs', price: 49.99, originalPrice: 59.99 },
          { size: '5 lbs', price: 89.99, originalPrice: 109.99 }
        ]),
        nutritionFacts: JSON.stringify({
          servingSize: '1 scoop (30g)',
          servingsPerContainer: 33,
          calories: 120,
          protein: '25g',
          carbs: '2g',
          fat: '1g',
          sodium: '50mg',
          ingredients: 'Whey Protein Isolate, Natural Flavors, Lecithin, Stevia'
        }),
        ingredients: 'Whey Protein Isolate, Natural Flavors, Lecithin, Stevia Leaf Extract',
        stockQuantity: 100,
        minStockLevel: 10,
        isActive: true,
        isFeatured: true,
        weight: 2.5,
        dimensions: JSON.stringify({ length: 15, width: 10, height: 20 }),
        brand: 'HOPG Premium',
        sku: 'HOPG-WPI-001',
        rating: 4.8,
        reviewCount: 324,
        salesCount: 1250,
        tags: JSON.stringify(['protein', 'isolate', 'grass-fed', 'muscle-building']),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Mass Gainer Pro 5000',
        description: 'High-calorie mass gainer with 50g protein and complex carbohydrates for serious muscle building. Each serving provides 1000+ calories to help you bulk up effectively.',
        price: 89.99,
        originalPrice: 109.99,
        categoryId: categories.find(cat => cat.name === 'Mass Gainers').id,
        imageUrl: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&h=400&fit=crop',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&h=400&fit=crop',
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop'
        ]),
        flavors: JSON.stringify(['Chocolate', 'Vanilla', 'Strawberry']),
        sizes: JSON.stringify([
          { size: '5 lbs', price: 89.99, originalPrice: 109.99 },
          { size: '10 lbs', price: 159.99, originalPrice: 199.99 }
        ]),
        nutritionFacts: JSON.stringify({
          servingSize: '2 scoops (150g)',
          servingsPerContainer: 15,
          calories: 1050,
          protein: '50g',
          carbs: '160g',
          fat: '8g',
          sodium: '120mg'
        }),
        ingredients: 'Whey Protein Concentrate, Maltodextrin, Oats, Natural Flavors, Creatine Monohydrate',
        stockQuantity: 50,
        minStockLevel: 5,
        isActive: true,
        isFeatured: true,
        weight: 5.0,
        dimensions: JSON.stringify({ length: 20, width: 15, height: 25 }),
        brand: 'HOPG Gold',
        sku: 'HOPG-MG-002',
        rating: 4.9,
        reviewCount: 189,
        salesCount: 850,
        tags: JSON.stringify(['mass-gainer', 'high-calorie', 'muscle-building', 'bulking']),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Pure Creatine Monohydrate',
        description: 'Micronized creatine monohydrate for improved strength, power, and muscle mass. Third-party tested for purity and potency.',
        price: 24.99,
        originalPrice: 29.99,
        categoryId: categories.find(cat => cat.name === 'Creatine').id,
        imageUrl: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=400&fit=crop',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=400&fit=crop'
        ]),
        flavors: JSON.stringify(['Unflavored', 'Fruit Punch']),
        sizes: JSON.stringify([
          { size: '1 lb', price: 24.99, originalPrice: 29.99 },
          { size: '2 lbs', price: 44.99, originalPrice: 54.99 }
        ]),
        nutritionFacts: JSON.stringify({
          servingSize: '1 scoop (5g)',
          servingsPerContainer: 90,
          calories: 0,
          protein: '0g',
          carbs: '0g',
          fat: '0g',
          creatine: '5g'
        }),
        ingredients: 'Creatine Monohydrate',
        stockQuantity: 200,
        minStockLevel: 20,
        isActive: true,
        isFeatured: true,
        weight: 1.0,
        dimensions: JSON.stringify({ length: 12, width: 8, height: 15 }),
        brand: 'HOPG Premium',
        sku: 'HOPG-CR-003',
        rating: 4.7,
        reviewCount: 256,
        salesCount: 2100,
        tags: JSON.stringify(['creatine', 'strength', 'power', 'performance']),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Energy Blast Pre Workout',
        description: 'Get energized for intense workouts with our pre-workout formula. Contains caffeine, beta-alanine, and citrulline for maximum performance.',
        price: 34.99,
        originalPrice: 44.99,
        categoryId: categories.find(cat => cat.name === 'Pre Workout').id,
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop'
        ]),
        flavors: JSON.stringify(['Berry Blast', 'Tropical', 'Watermelon']),
        sizes: JSON.stringify([
          { size: '1 lb', price: 34.99, originalPrice: 44.99 },
          { size: '2 lbs', price: 64.99, originalPrice: 79.99 }
        ]),
        nutritionFacts: JSON.stringify({
          servingSize: '1 scoop (12g)',
          servingsPerContainer: 30,
          calories: 5,
          caffeine: '200mg',
          betaAlanine: '3g',
          citrulline: '6g'
        }),
        ingredients: 'Caffeine, Beta-Alanine, L-Citrulline, Taurine, Natural Flavors',
        stockQuantity: 75,
        minStockLevel: 10,
        isActive: true,
        isFeatured: false,
        weight: 1.0,
        dimensions: JSON.stringify({ length: 12, width: 8, height: 15 }),
        brand: 'HOPG Pro',
        sku: 'HOPG-PW-004',
        rating: 4.6,
        reviewCount: 198,
        salesCount: 650,
        tags: JSON.stringify(['pre-workout', 'energy', 'caffeine', 'performance']),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Complete Meal Replacement',
        description: 'Nutritionally complete meal replacement with 25g protein, essential vitamins, and minerals. Perfect for busy lifestyles.',
        price: 39.99,
        originalPrice: 49.99,
        categoryId: categories.find(cat => cat.name === 'Meal Replacement').id,
        imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop'
        ]),
        flavors: JSON.stringify(['Chocolate', 'Vanilla', 'Berry']),
        sizes: JSON.stringify([
          { size: '2 lbs', price: 39.99, originalPrice: 49.99 },
          { size: '4 lbs', price: 69.99, originalPrice: 89.99 }
        ]),
        nutritionFacts: JSON.stringify({
          servingSize: '1 scoop (40g)',
          servingsPerContainer: 23,
          calories: 150,
          protein: '25g',
          carbs: '8g',
          fat: '3g',
          fiber: '5g',
          vitamins: 'A, B, C, D, E'
        }),
        ingredients: 'Whey Protein, Pea Protein, Oat Fiber, Vitamins, Minerals, Natural Flavors',
        stockQuantity: 60,
        minStockLevel: 8,
        isActive: true,
        isFeatured: false,
        weight: 2.0,
        dimensions: JSON.stringify({ length: 15, width: 10, height: 18 }),
        brand: 'HOPG Gold',
        sku: 'HOPG-MR-005',
        rating: 4.5,
        reviewCount: 142,
        salesCount: 420,
        tags: JSON.stringify(['meal-replacement', 'complete-nutrition', 'vitamins', 'convenient']),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Advanced Whey Protein',
        description: 'Premium whey protein blend with added digestive enzymes for better absorption. Great for muscle recovery and growth.',
        price: 42.99,
        originalPrice: 52.99,
        categoryId: categories.find(cat => cat.name === 'Whey Protein').id,
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop'
        ]),
        flavors: JSON.stringify(['Chocolate', 'Cookies & Cream', 'Peanut Butter']),
        sizes: JSON.stringify([
          { size: '2 lbs', price: 42.99, originalPrice: 52.99 },
          { size: '5 lbs', price: 99.99, originalPrice: 124.99 }
        ]),
        nutritionFacts: JSON.stringify({
          servingSize: '1 scoop (32g)',
          servingsPerContainer: 28,
          calories: 130,
          protein: '24g',
          carbs: '3g',
          fat: '2g',
          enzymes: 'Protease, Lactase'
        }),
        ingredients: 'Whey Protein Concentrate, Whey Protein Isolate, Digestive Enzymes, Natural Flavors',
        stockQuantity: 80,
        minStockLevel: 10,
        isActive: true,
        isFeatured: false,
        weight: 2.0,
        dimensions: JSON.stringify({ length: 15, width: 10, height: 18 }),
        brand: 'HOPG Premium',
        sku: 'HOPG-AWP-006',
        rating: 4.7,
        reviewCount: 287,
        salesCount: 890,
        tags: JSON.stringify(['whey-protein', 'digestive-enzymes', 'muscle-recovery', 'premium']),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('Products', products);
    
    // Store product IDs for use in other seeders
    global.productIds = products.map(product => ({ name: product.name, id: product.id }));
    
    console.log('✅ Products seeded successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Products', null, {});
  }
};
