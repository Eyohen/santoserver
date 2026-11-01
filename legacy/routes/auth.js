// routes/auth.js
const express = require('express');
const { register, login, getProfile, updateProfile } = require('../controller/auth');
const { verifyToken } = require('../middleware/auth');
const { validateRegister } = require('../middleware/validation');

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login', login);
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);

module.exports = router;
