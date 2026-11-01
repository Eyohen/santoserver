
// routes/address.js
const express = require('express');
const { create, getUserAddresses, getById, update, deleteAddress, setDefault } = require('../controller/address');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', verifyToken, create);
router.get('/', verifyToken, getUserAddresses);
router.get('/:id', verifyToken, getById);
router.put('/:id', verifyToken, update);
router.put('/:id/default', verifyToken, setDefault);
router.delete('/:id', verifyToken, deleteAddress);

module.exports = router;