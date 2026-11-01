// routes/cart.js
const express = require('express');
const { addToCart, getCart, updateCartItem, removeFromCart, clearCart, mergeGuestCart } = require('../controller/cart');
const { verifyToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Use optionalAuth for addToCart to allow both guest and authenticated users
router.post('/', optionalAuth, addToCart);
router.get('/', verifyToken, getCart);
router.put('/:id', verifyToken, updateCartItem);
router.delete('/:id', verifyToken, removeFromCart);
router.delete('/', verifyToken, clearCart);
router.post('/merge', verifyToken, mergeGuestCart);

module.exports = router;