
// controller/auth.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../models');
const { User } = db;

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      verificationToken: crypto.randomBytes(32).toString('hex')
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get profile', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, dateOfBirth } = req.body;
    
    const user = await User.findByPk(req.user.id);
    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      phone: phone || user.phone,
      dateOfBirth: dateOfBirth || user.dateOfBirth
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

module.exports = { register, login, getProfile, updateProfile };