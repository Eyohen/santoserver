'use strict';

/** Lets controllers be async without try/catch in every handler. */
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const bad = (message, field) => Object.assign(new Error(message), { status: 400, field });

const str = (v, label, { max = 255, required = true } = {}) => {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s && required) throw bad(`${label} is required.`, label);
  if (s.length > max) throw bad(`${label} is too long.`, label);
  return s;
};

const email = (v) => {
  const s = str(v, 'Email', { max: 160 }).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(s)) throw bad('Enter a valid email address.', 'email');
  return s;
};

/** Accepts 0803..., 234803... or +234803... and stores the 0-prefixed form. */
const phone = (v) => {
  const digits = str(v, 'Phone', { max: 20 }).replace(/[\s-]/g, '');
  if (!/^(\+?234|0)\d{10}$/.test(digits)) throw bad('Enter a Nigerian phone number, like 0803 123 4567.', 'phone');
  return digits.replace(/^\+?234/, '0');
};

const int = (v, label, { min = 0, max = 100000000 } = {}) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw bad(`${label} must be a whole number between ${min} and ${max}.`, label);
  return n;
};

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.status || (err.name === 'SequelizeValidationError' ? 400 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({
    message: status >= 500 && process.env.NODE_ENV === 'production' ? 'Something went wrong.' : err.message,
    ...(err.field && { field: err.field }),
    ...(err.sku && { sku: err.sku }),
    ...(err.available != null && { available: err.available }),
  });
}

module.exports = { wrap, bad, str, email, phone, int, errorHandler };
