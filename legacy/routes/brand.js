// routes/brand.js
const express = require('express');
const { 
  create, 
  getAll, 
  getById, 
  update, 
  deleteBrand, 
  toggleStatus, 
  toggleFeatured, 
  getFeatured 
} = require('../controller/brand');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const multer = require('multer');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Public routes
router.get('/', getAll);
router.get('/featured', getFeatured);
router.get('/:id', getById);

// Admin routes
router.post('/', verifyToken, verifyAdmin, upload.single('logoUrl'), create);
router.put('/:id', verifyToken, verifyAdmin, upload.single('logoUrl'), update);
router.patch('/:id/toggle-status', verifyToken, verifyAdmin, toggleStatus);
router.patch('/:id/toggle-featured', verifyToken, verifyAdmin, toggleFeatured);
router.delete('/:id', verifyToken, verifyAdmin, deleteBrand);

module.exports = router;