
// routes/payment.js
const express = require('express');
const { confirmPayment, updatePaymentStatus, getPaymentStatus } = require('../controller/payment');
const { verifyToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/confirm', optionalAuth, confirmPayment);
router.post('/update-status', verifyToken, updatePaymentStatus);
router.get('/status/:orderId', verifyToken, getPaymentStatus);

module.exports = router;