// routes/discount.js
const express = require('express');
const {
  createDiscount,
  getAllDiscounts,
  getDiscountById,
  updateDiscount,
  deleteDiscount,
  toggleDiscountStatus,
  validateDiscountCode,
  createQuickDiscount
} = require('../controller/discount');
const { verifyToken, verifyAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Admin routes
router.post('/', verifyToken, verifyAdmin, createDiscount);
router.post('/quick', verifyToken, verifyAdmin, createQuickDiscount);
router.get('/', verifyToken, verifyAdmin, getAllDiscounts);
router.get('/:id', verifyToken, verifyAdmin, getDiscountById);
router.put('/:id', verifyToken, verifyAdmin, updateDiscount);
router.patch('/:id/toggle-status', verifyToken, verifyAdmin, toggleDiscountStatus);
router.delete('/:id', verifyToken, verifyAdmin, deleteDiscount);

// Public routes (for checkout)
router.post('/validate', optionalAuth, validateDiscountCode);

module.exports = router;