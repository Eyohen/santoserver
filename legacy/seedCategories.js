// seedCategories.js
require('dotenv').config();
const db = require('./models');
const { Category } = db;

const categories = [
  {
    name: 'Protein Powder',
    description: 'High-quality protein powders for muscle building and recovery',
    sortOrder: 1,
    isActive: true
  },
  {
    name: 'Pre Workout',
    description: 'Energy-boosting supplements to maximize your workout performance',
    sortOrder: 2,
    isActive: true
  },
  {
    name: 'Creatine',
    description: 'Pure creatine supplements for strength and muscle gains',
    sortOrder: 3,
    isActive: true
  },
  {
    name: 'Meal Replacements',
    description: 'Convenient and nutritious meal replacement shakes and bars',
    sortOrder: 4,
    isActive: true
  }
];

const seedCategories = async () => {
  try {
    // Connect to database
    await db.sequelize.authenticate();
    console.log('✅ Database connection established');

    // Sync models
    await db.sequelize.sync();
    console.log('✅ Models synchronized');

    // Insert categories
    for (const categoryData of categories) {
      // Check if category already exists
      const existingCategory = await Category.findOne({
        where: { name: categoryData.name }
      });

      if (existingCategory) {
        console.log(`⚠️  Category "${categoryData.name}" already exists, skipping...`);
        continue;
      }

      const category = await Category.create(categoryData);
      console.log(`✅ Created category: ${category.name} (ID: ${category.id})`);
    }

    console.log('\n🎉 Categories seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding categories:', error.message);
    process.exit(1);
  }
};

// Run the seed function
seedCategories();