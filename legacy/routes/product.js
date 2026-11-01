
// routes/product.js
const express = require('express');
const { create, getAll, getById, update, deleteProduct, getFeatured } = require('../controller/product');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { validateProduct } = require('../middleware/validation');
const multer = require('multer');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', verifyToken, verifyAdmin, upload.array('imageUrl', 5), validateProduct, create);
router.get('/', getAll);
router.get('/featured', getFeatured);
router.get('/:id', getById);
router.put('/:id', verifyToken, verifyAdmin, upload.single('imageUrl'), update);
router.delete('/:id', verifyToken, verifyAdmin, deleteProduct);

module.exports = router;