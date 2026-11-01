
// routes/order.js
const express = require('express');
const { createOrder, getUserOrders, getAllOrders, getOrderById, updateOrderStatus } = require('../controller/order');
const { verifyToken, optionalAuth, verifyAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/', optionalAuth, createOrder); // Allow guest checkout
router.get('/', verifyToken, getUserOrders);
router.get('/admin/all', verifyToken, verifyAdmin, getAllOrders); // Admin: get all orders
router.get('/:id', verifyToken, getOrderById);
router.put('/:id/status', verifyToken, verifyAdmin, updateOrderStatus);

module.exports = router;