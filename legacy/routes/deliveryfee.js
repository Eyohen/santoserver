const express = require('express');
const {
  create,
  getAll,
  getById,
  getByState,
  getByZone,
  update,
  deleteDeliveryFee,
  bulkCreate
} = require('../controller/deliveryfee');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { validateDeliveryFee } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/', getAll);
router.get('/state/:state', getByState);
router.get('/zone/:zone', getByZone);
router.get('/:id', getById);

// Admin routes
router.post('/', verifyToken, verifyAdmin, validateDeliveryFee, create);
router.post('/bulk', verifyToken, verifyAdmin, bulkCreate);
router.put('/:id', verifyToken, verifyAdmin, validateDeliveryFee, update);
router.delete('/:id', verifyToken, verifyAdmin, deleteDeliveryFee);

module.exports = router;