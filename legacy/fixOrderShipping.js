// Fix script to update shipping field in orders where it's missing
// Run with: node fixOrderShipping.js

const db = require('./models');
const { Order, Address, DeliveryFee } = db;

async function fixOrderShipping() {
  try {
    console.log('=== FIXING ORDER SHIPPING FIELDS ===\n');

    // Find all orders where shipping = 0 but total > subtotal
    const ordersToFix = await Order.findAll({
      where: { shipping: 0 },
      include: [
        {
          model: Address,
          as: 'shippingAddress',
          required: false
        }
      ]
    });

    console.log(`Found ${ordersToFix.length} orders with shipping = 0\n`);

    let fixed = 0;
    let skipped = 0;
    let errors = 0;

    for (const order of ordersToFix) {
      const subtotal = parseFloat(order.subtotal || 0);
      const discount = parseFloat(order.discountAmount || 0);
      const total = parseFloat(order.total || 0);

      // Calculate what the shipping should be
      const calculatedShipping = total - subtotal + discount;

      if (calculatedShipping <= 0) {
        console.log(`⏭️  Skipping ${order.orderNumber} - calculated shipping is ${calculatedShipping}`);
        skipped++;
        continue;
      }

      // Get the state
      const state = order.shippingAddress?.state || order.guestShippingInfo?.state;

      if (!state) {
        console.log(`⚠️  ${order.orderNumber} - No state found, but will update shipping to ${calculatedShipping.toFixed(2)}`);
      }

      // Try to find the delivery fee record
      let deliveryFeeId = null;
      if (state) {
        const deliveryFee = await DeliveryFee.findOne({
          where: { state: state, isActive: true }
        });

        if (deliveryFee) {
          deliveryFeeId = deliveryFee.id;
          console.log(`✅ ${order.orderNumber} - Found delivery fee for ${state}: ₦${deliveryFee.fee}`);

          // Verify it matches our calculation
          if (Math.abs(parseFloat(deliveryFee.fee) - calculatedShipping) > 0.01) {
            console.log(`   ⚠️  Warning: Delivery fee (${deliveryFee.fee}) doesn't match calculated (${calculatedShipping.toFixed(2)})`);
            console.log(`   Using calculated value from order total`);
          }
        } else {
          console.log(`⚠️  ${order.orderNumber} - No delivery fee record for state: ${state}`);
        }
      }

      try {
        // Update the order
        await order.update({
          shipping: calculatedShipping,
          deliveryFeeId: deliveryFeeId || order.deliveryFeeId
        });

        console.log(`✅ Fixed ${order.orderNumber}: Set shipping to ₦${calculatedShipping.toFixed(2)}`);
        console.log(`   Subtotal: ₦${subtotal.toFixed(2)} | Discount: ₦${discount.toFixed(2)} | Shipping: ₦${calculatedShipping.toFixed(2)} | Total: ₦${total.toFixed(2)}\n`);

        fixed++;
      } catch (error) {
        console.error(`❌ Error fixing ${order.orderNumber}:`, error.message);
        errors++;
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Total orders checked: ${ordersToFix.length}`);
    console.log(`✅ Fixed: ${fixed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('\n=== FIX COMPLETE ===');

  } catch (error) {
    console.error('Error during fix:', error);
  } finally {
    await db.sequelize.close();
  }
}

// Confirm before running
console.log('⚠️  WARNING: This will update shipping values in the Order table.');
console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

setTimeout(() => {
  fixOrderShipping();
}, 5000);
