// middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../models');
const { User } = db;

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid access token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Access token expired' });
    }
    return res.status(500).json({ message: 'Token verification failed' });
  }
};

// Optional authentication - doesn't fail if no token is provided
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue as guest
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.id);
    if (user) {
      req.user = user;
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    // If token is invalid, continue as guest
    req.user = null;
    next();
  }
};

const verifyAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Authorization check failed' });
  }
};

module.exports = { verifyToken, optionalAuth, verifyAdmin };