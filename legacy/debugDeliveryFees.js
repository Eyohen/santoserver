// Debug script to check delivery fee configuration
// Run with: node debugDeliveryFees.js

const db = require('./models');
const { DeliveryFee, Order, Address } = db;

async function debugDeliveryFees() {
  try {
    console.log('=== DELIVERY FEE CONFIGURATION DEBUG ===\n');

    // 1. Check all delivery fees in the database
    console.log('1. All Delivery Fees in Database:');
    const allFees = await DeliveryFee.findAll({
      order: [['state', 'ASC']]
    });

    console.log(`Total delivery fees: ${allFees.length}\n`);
    allFees.forEach(fee => {
      console.log(`  - ${fee.state}: ₦${fee.fee} (${fee.isActive ? 'ACTIVE' : 'INACTIVE'}) - Zone: ${fee.zone || 'N/A'}`);
    });

    // 2. Check active delivery fees only
    console.log('\n2. Active Delivery Fees:');
    const activeFees = await DeliveryFee.findAll({
      where: { isActive: true },
      order: [['state', 'ASC']]
    });

    console.log(`Total active: ${activeFees.length}\n`);
    activeFees.forEach(fee => {
      console.log(`  - ${fee.state}: ₦${fee.fee} - Zone: ${fee.zone || 'N/A'}`);
    });

    // 3. Check recent orders with shipping = 0
    console.log('\n3. Recent Orders with Shipping = 0:');
    const ordersWithZeroShipping = await Order.findAll({
      where: { shipping: 0 },
      include: [
        {
          model: Address,
          as: 'shippingAddress',
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    console.log(`Found ${ordersWithZeroShipping.length} orders with shipping = 0\n`);

    for (const order of ordersWithZeroShipping) {
      const state = order.shippingAddress?.state || order.guestShippingInfo?.state || 'N/A';
      console.log(`  Order ${order.orderNumber}:`);
      console.log(`    State: "${state}"`);
      console.log(`    Subtotal: ₦${order.subtotal}`);
      console.log(`    Shipping: ₦${order.shipping}`);
      console.log(`    Total: ₦${order.total}`);
      console.log(`    Hidden delivery fee: ₦${parseFloat(order.total) - parseFloat(order.subtotal) + parseFloat(order.discountAmount || 0)}`);

      // Try to find matching delivery fee
      if (state !== 'N/A') {
        const matchingFee = await DeliveryFee.findOne({
          where: { state: state, isActive: true }
        });

        if (matchingFee) {
          console.log(`    ✅ Matching delivery fee found: ₦${matchingFee.fee}`);
        } else {
          console.log(`    ❌ No matching delivery fee found for state: "${state}"`);

          // Try case-insensitive search
          const allStates = activeFees.map(f => f.state);
          const similarState = allStates.find(s => s.toLowerCase() === state.toLowerCase());
          if (similarState) {
            console.log(`    ⚠️  Similar state found with different case: "${similarState}"`);
          }
        }
      }
      console.log('');
    }

    // 4. Check unique states in addresses vs delivery fees
    console.log('\n4. State Name Matching Analysis:');
    const addresses = await Address.findAll({
      attributes: ['state'],
      group: ['state']
    });

    const addressStates = [...new Set(addresses.map(a => a.state))];
    const feeStates = activeFees.map(f => f.state);

    console.log('\nStates in Addresses but NOT in Delivery Fees:');
    const missingFees = addressStates.filter(state => !feeStates.includes(state));
    if (missingFees.length === 0) {
      console.log('  ✅ All address states have delivery fees');
    } else {
      missingFees.forEach(state => {
        console.log(`  ❌ "${state}"`);
        // Check for case-insensitive match
        const similarState = feeStates.find(s => s.toLowerCase() === state.toLowerCase());
        if (similarState) {
          console.log(`     ⚠️  Found similar state with different case: "${similarState}"`);
        }
      });
    }

    console.log('\n=== DEBUG COMPLETE ===');

  } catch (error) {
    console.error('Error during debug:', error);
  } finally {
    await db.sequelize.close();
  }
}

debugDeliveryFees();
