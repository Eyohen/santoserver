// routes/user.js
const express = require('express');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
  changePassword
} = require('../controller/user');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/readall', verifyToken, verifyAdmin, getAllUsers);

// Get user statistics (admin only)
router.get('/stats', verifyToken, verifyAdmin, getUserStats);

// Get user by ID (admin only)
router.get('/:id', verifyToken, verifyAdmin, getUserById);

// Update user (admin only)
router.put('/:id', verifyToken, verifyAdmin, updateUser);

// Change user password (admin only)
router.patch('/:id/change-password', verifyToken, verifyAdmin, changePassword);

// Delete user (admin only)
router.delete('/:id', verifyToken, verifyAdmin, deleteUser);

module.exports = router;