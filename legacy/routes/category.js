
// routes/category.js
const express = require('express');
const { create, getAll, getById, update, deleteCategory } = require('../controller/category');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const multer = require('multer');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', verifyToken, verifyAdmin, upload.single('imageUrl'), create);
router.get('/', getAll);
router.get('/:id', getById);
router.put('/:id', verifyToken, verifyAdmin, upload.single('imageUrl'), update);
router.delete('/:id', verifyToken, verifyAdmin, deleteCategory);

module.exports = router;
