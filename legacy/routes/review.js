
// routes/review.js
const express = require('express');
const { create, getProductReviews, getUserReviews, update, deleteReview } = require('../controller/review');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', verifyToken, create);
router.get('/product/:productId', getProductReviews);
router.get('/user', verifyToken, getUserReviews);
router.put('/:id', verifyToken, update);
router.delete('/:id', verifyToken, deleteReview);

module.exports = router;

