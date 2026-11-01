require('dotenv').config();
const db = require('../models');
const nigerianStatesDeliveryFees = require('./deliveryFees');

db.sequelize.sync().then(async () => {
  await db.DeliveryFee.bulkCreate(nigerianStatesDeliveryFees, { ignoreDuplicates: true });
  console.log('✅ Delivery fees seeded');
  process.exit(0);
});