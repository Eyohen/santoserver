// fixEmptyImages.js
require('dotenv').config();
const db = require('./models');

const fixImages = async () => {
  await db.sequelize.authenticate();
  
  const [updated] = await db.Product.update(
    { imageUrl: null },
    { where: { imageUrl: '' } }
  );
  
  console.log(`Fixed ${updated} products with empty imageUrl`);
  process.exit(0);
};

fixImages();