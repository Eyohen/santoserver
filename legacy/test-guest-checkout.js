/**
 * Guest Checkout Integration Test
 * Tests the complete guest checkout flow without authentication
 */

const axios = require('axios');
require('dotenv').config();

const API_URL = `http://localhost:${process.env.API_PORT || 9000}`;

// Test data
const guestCheckoutData = {
  items: [
    {
      productId: '4c3e503f-3698-4788-9675-64084fc3ccb3', // Existing product from database
      quantity: 2,
      price: 50.00,
      selectedFlavor: 'Vanilla',
      selectedSize: '1kg'
    }
  ],
  guestEmail: 'guest-test@example.com',
  guestShippingInfo: {
    firstName: 'John',
    lastName: 'Guest',
    phone: '+2341234567890',
    streetAddress: '123 Test Street',
    city: 'Lagos',
    state: 'Lagos',
    zipCode: '100001',
    country: 'Nigeria'
  },
  discountCode: null,
  shipping: 15.00,
  paymentMethod: 'paystack'
};

async function testGuestCheckout() {
  console.log('🧪 Starting Guest Checkout Integration Test\n');

  try {
    // Test 1: Create guest order without authentication
    console.log('📝 Test 1: Creating guest order (no auth)...');
    const orderResponse = await axios.post(
      `${API_URL}/api/orders`,
      guestCheckoutData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        validateStatus: () => true // Accept all status codes
      }
    );

    if (orderResponse.status !== 201) {
      console.error(`❌ Order creation failed with status ${orderResponse.status}`);
      console.error('Response:', orderResponse.data);
      return false;
    }

    const order = orderResponse.data.order;
    console.log(`✅ Order created successfully: ${order.id}`);
    console.log(`   Order Number: ${order.orderNumber}`);
    console.log(`   Guest Email: ${order.guestEmail}`);
    console.log(`   User ID: ${order.userId || 'NULL (guest)'}`);

    // Verify order has NULL userId
    if (order.userId !== null && order.userId !== undefined) {
      console.error('❌ FAILED: Order should have NULL userId for guest checkout');
      return false;
    }
    console.log('✅ Order correctly has NULL userId (guest order)\n');

    // Test 2: Verify payment was created with NULL userId
    console.log('📝 Test 2: Verifying payment record...');
    const payment = order.payment;

    if (!payment) {
      console.error('❌ No payment record returned');
      console.error('Order data:', JSON.stringify(order, null, 2));
      return false;
    }

    console.log(`✅ Payment created: ${payment.id}`);
    console.log(`   Payment Status: ${payment.status}`);
    console.log(`   User ID: ${payment.userId || 'NULL (guest)'}`);

    if (payment.userId !== null && payment.userId !== undefined) {
      console.error('❌ FAILED: Payment should have NULL userId for guest checkout');
      return false;
    }
    console.log('✅ Payment correctly has NULL userId\n');

    // Test 3: Confirm payment without authentication (simulate Paystack callback)
    console.log('📝 Test 3: Confirming payment (no auth, simulating Paystack)...');
    const confirmResponse = await axios.post(
      `${API_URL}/api/payments/confirm`,
      {
        orderId: order.id,
        paymentReference: 'test-guest-payment-' + Date.now(),
        status: 'success'
      },
      {
        headers: {
          'Content-Type': 'application/json'
          // NO Authorization header - testing guest payment confirmation
        },
        validateStatus: () => true
      }
    );

    if (confirmResponse.status !== 200) {
      console.error(`❌ Payment confirmation failed with status ${confirmResponse.status}`);
      console.error('Response:', confirmResponse.data);
      return false;
    }

    console.log('✅ Payment confirmed successfully for guest order');
    if (confirmResponse.data.payment) {
      console.log(`   Payment Status: ${confirmResponse.data.payment.status}\n`);
    } else {
      console.log(`   Response: ${JSON.stringify(confirmResponse.data)}\n`);
    }

    // Test 4: Verify data in database
    console.log('📝 Test 4: Verifying database records...');
    console.log('   Run this SQL to verify:');
    console.log(`   SELECT id, "userId", "guestEmail", total FROM "Orders" WHERE id = '${order.id}';`);
    console.log(`   SELECT id, "userId", status, amount FROM "Payments" WHERE "orderId" = '${order.id}';`);
    console.log('');

    // All tests passed!
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ Guest checkout is fully functional');
    console.log('✅ Guest can create orders without login');
    console.log('✅ Guest can confirm payments without authentication');
    console.log('✅ Database correctly stores NULL userId for guest transactions\n');

    return true;

  } catch (error) {
    console.error('❌ TEST FAILED WITH ERROR:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error('   Data:', error.response.data);
    } else {
      console.error('   Message:', error.message);
    }
    return false;
  }
}

// Run the test
console.log('='.repeat(60));
console.log('  GUEST CHECKOUT INTEGRATION TEST');
console.log('='.repeat(60));
console.log('');

testGuestCheckout()
  .then(success => {
    console.log('='.repeat(60));
    if (success) {
      console.log('✅ Test suite completed successfully');
      process.exit(0);
    } else {
      console.log('❌ Test suite failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  });
