'use strict';
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const tokenFrom = (req) => {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
};

async function load(token) {
  const { id } = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findByPk(id);
  return user && user.isActive ? user : null;
}

/** Requires a valid token. */
async function requireAuth(req, res, next) {
  const token = tokenFrom(req);
  if (!token) return res.status(401).json({ message: 'Sign in to continue.' });
  try {
    req.user = await load(token);
    if (!req.user) return res.status(401).json({ message: 'Your session is no longer valid.' });
    next();
  } catch {
    res.status(401).json({ message: 'Your session has expired. Sign in again.' });
  }
}

/** Attaches the user when a valid token is present, otherwise carries on as a guest. */
async function optionalAuth(req, res, next) {
  req.user = null;
  const token = tokenFrom(req);
  if (token) {
    try { req.user = await load(token); } catch { /* treat a bad token as a guest */ }
  }
  next();
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });
  next();
}

const sign = (user) => jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

module.exports = { requireAuth, optionalAuth, requireAdmin, sign };
