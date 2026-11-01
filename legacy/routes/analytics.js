// routes/analytics.js
const express = require('express');
const { getDashboardStats, getOrderAnalytics } = require('../controller/analytics');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', verifyToken, verifyAdmin, getDashboardStats);

// Get order analytics with enhanced timeline options
// Supports: day, week, month, 3months, 6months, year
router.get('/orders', verifyToken, verifyAdmin, getOrderAnalytics);

module.exports = router;