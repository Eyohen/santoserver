// Inspect a specific order to see all fields and calculations
// Run with: node inspectOrder.js <orderNumber>

const db = require('./models');
const { Order, OrderItem, Product, Address, Payment, DeliveryFee, Discount } = db;

async function inspectOrder() {
  try {
    const orderNumber = process.argv[2];

    if (!orderNumber) {
      console.log('Usage: node inspectOrder.js <orderNumber>');
      console.log('Example: node inspectOrder.js ORD-1234567890');
      process.exit(1);
    }

    console.log(`\n=== INSPECTING ORDER: ${orderNumber} ===\n`);

    const order = await Order.findOne({
      where: { orderNumber },
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          include: [{ model: Product, as: 'product' }]
        },
        {
          model: Address,
          as: 'shippingAddress'
        },
        {
          model: Payment,
          as: 'payment'
        },
        {
          model: DeliveryFee,
          as: 'deliveryFee'
        },
        {
          model: Discount,
          as: 'discount'
        }
      ]
    });

    if (!order) {
      console.log(`❌ Order ${orderNumber} not found`);
      process.exit(1);
    }

    // Display order basic info
    console.log('ORDER BASIC INFO:');
    console.log(`  Order Number: ${order.orderNumber}`);
    console.log(`  Status: ${order.status}`);
    console.log(`  Created: ${order.createdAt}`);
    console.log(`  User ID: ${order.userId || 'GUEST'}`);

    // Display shipping address
    console.log('\nSHIPPING ADDRESS:');
    const shippingState = order.shippingAddress?.state || order.guestShippingInfo?.state || 'N/A';
    console.log(`  State: "${shippingState}"`);
    if (order.shippingAddress) {
      console.log(`  Full Address: ${order.shippingAddress.streetAddress}, ${order.shippingAddress.city}, ${order.shippingAddress.state}`);
    } else if (order.guestShippingInfo) {
      console.log(`  Guest Address: ${order.guestShippingInfo.streetAddress}, ${order.guestShippingInfo.city}, ${order.guestShippingInfo.state}`);
    }

    // Display order items
    console.log('\nORDER ITEMS:');
    let calculatedSubtotal = 0;
    for (const item of order.orderItems) {
      const itemTotal = parseFloat(item.subtotal || 0);
      calculatedSubtotal += itemTotal;
      console.log(`  - ${item.product?.name || 'Unknown Product'}`);
      console.log(`    Quantity: ${item.quantity}`);
      console.log(`    Price: ₦${parseFloat(item.price || 0).toFixed(2)}`);
      console.log(`    Subtotal: ₦${itemTotal.toFixed(2)}`);
    }

    // Display financial breakdown
    console.log('\nSTORED FINANCIAL DATA:');
    const storedSubtotal = parseFloat(order.subtotal || 0);
    const storedDiscount = parseFloat(order.discountAmount || 0);
    const storedShipping = parseFloat(order.shipping || 0);
    const storedTax = parseFloat(order.tax || 0);
    const storedTotal = parseFloat(order.total || 0);

    console.log(`  Subtotal (stored): ₦${storedSubtotal.toFixed(2)}`);
    console.log(`  Subtotal (calculated from items): ₦${calculatedSubtotal.toFixed(2)}`);
    if (Math.abs(storedSubtotal - calculatedSubtotal) > 0.01) {
      console.log(`  ⚠️  MISMATCH: Difference of ₦${Math.abs(storedSubtotal - calculatedSubtotal).toFixed(2)}`);
    }

    console.log(`\n  Discount Amount: ₦${storedDiscount.toFixed(2)}`);
    if (order.discount) {
      console.log(`    Discount Code: ${order.discount.code}`);
      console.log(`    Discount Type: ${order.discount.type}`);
      console.log(`    Discount Value: ${order.discount.value}`);
    }

    console.log(`\n  Tax: ₦${storedTax.toFixed(2)}`);
    console.log(`  Shipping (stored): ₦${storedShipping.toFixed(2)}`);

    // Check delivery fee
    console.log('\nDELIVERY FEE INFO:');
    console.log(`  Delivery Fee ID: ${order.deliveryFeeId || 'NULL'}`);

    if (order.deliveryFee) {
      console.log(`  Delivery Fee Record Found:`);
      console.log(`    State: ${order.deliveryFee.state}`);
      console.log(`    Fee: ₦${parseFloat(order.deliveryFee.fee).toFixed(2)}`);
      console.log(`    Zone: ${order.deliveryFee.zone || 'N/A'}`);
      console.log(`    Active: ${order.deliveryFee.isActive}`);
    } else {
      console.log(`  ❌ No delivery fee record linked`);

      // Try to find matching delivery fee
      if (shippingState !== 'N/A') {
        const matchingFee = await DeliveryFee.findOne({
          where: { state: shippingState, isActive: true }
        });

        if (matchingFee) {
          console.log(`  ⚠️  BUT found active delivery fee for "${shippingState}": ₦${parseFloat(matchingFee.fee).toFixed(2)}`);
        } else {
          console.log(`  ❌ No active delivery fee found for "${shippingState}"`);
        }
      }
    }

    console.log(`\n  Total (stored): ₦${storedTotal.toFixed(2)}`);

    // Calculate what total should be
    const calculatedTotal = storedSubtotal - storedDiscount + storedShipping + storedTax;
    console.log(`  Total (calculated from stored values): ₦${calculatedTotal.toFixed(2)}`);

    if (Math.abs(storedTotal - calculatedTotal) > 0.01) {
      console.log(`  ⚠️  MISMATCH: Difference of ₦${Math.abs(storedTotal - calculatedTotal).toFixed(2)}`);
      console.log(`  This means there are hidden fees in the total!`);
    }

    // Calculate implied shipping if stored shipping is 0
    if (storedShipping === 0 && storedTotal > storedSubtotal) {
      const impliedShipping = storedTotal - storedSubtotal + storedDiscount - storedTax;
      console.log(`\n  Implied Shipping (from total): ₦${impliedShipping.toFixed(2)}`);

      if (order.deliveryFee) {
        const expectedShipping = parseFloat(order.deliveryFee.fee);
        if (Math.abs(impliedShipping - expectedShipping) > 0.01) {
          console.log(`  ⚠️  Implied shipping (₦${impliedShipping.toFixed(2)}) doesn't match delivery fee record (₦${expectedShipping.toFixed(2)})`);
          console.log(`  Difference: ₦${Math.abs(impliedShipping - expectedShipping).toFixed(2)}`);
        }
      }
    }

    // Payment info
    console.log('\nPAYMENT INFO:');
    if (order.payment) {
      console.log(`  Payment Method: ${order.payment.paymentMethod}`);
      console.log(`  Payment Status: ${order.payment.status}`);
      console.log(`  Payment Amount: ₦${parseFloat(order.payment.amount || 0).toFixed(2)}`);
      console.log(`  Paystack Reference: ${order.payment.paystackReference || 'N/A'}`);

      if (order.payment.gatewayResponse) {
        console.log(`\n  Gateway Response Data:`);
        console.log(JSON.stringify(order.payment.gatewayResponse, null, 2));
      }

      const paymentAmount = parseFloat(order.payment.amount || 0);
      if (Math.abs(paymentAmount - storedTotal) > 0.01) {
        console.log(`  ⚠️  Payment amount (₦${paymentAmount.toFixed(2)}) doesn't match order total (₦${storedTotal.toFixed(2)})`);
      }
    } else {
      console.log(`  No payment record found`);
    }

    console.log('\n=== INSPECTION COMPLETE ===\n');

  } catch (error) {
    console.error('Error during inspection:', error);
  } finally {
    await db.sequelize.close();
  }
}

inspectOrder();
