
// routes/wishlist.js
const express = require('express');
const { addToWishlist, getWishlist, removeFromWishlist, clearWishlist } = require('../controller/wishlist');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', verifyToken, addToWishlist);
router.get('/', verifyToken, getWishlist);
router.delete('/:productId', verifyToken, removeFromWishlist);
router.delete('/', verifyToken, clearWishlist);

module.exports = router;
