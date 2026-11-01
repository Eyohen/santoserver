'use strict';
const crypto = require('crypto');

const BASE = 'https://api.paystack.co';

function secret() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw Object.assign(new Error('Payments are not configured'), { status: 503 });
  return key;
}

async function call(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${secret()}`, 'Content-Type': 'application/json', ...options.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.status === false) {
    throw Object.assign(new Error(body.message || 'Paystack request failed'), { status: 502 });
  }
  return body.data;
}

/** Amounts are whole naira in our database; Paystack wants kobo. */
const toKobo = (naira) => Math.round(naira * 100);

const initializeTransaction = ({ email, amount, reference, callbackUrl, metadata }) =>
  call('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email,
      amount: toKobo(amount),
      currency: 'NGN',
      reference,
      callback_url: callbackUrl,
      metadata,
    }),
  });

const verifyTransaction = (reference) => call(`/transaction/verify/${encodeURIComponent(reference)}`);

/** Paystack signs the raw request body with HMAC-SHA512 using the secret key. */
function isValidSignature(rawBody, signature) {
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) return false;
  const expected = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { initializeTransaction, verifyTransaction, isValidSignature, toKobo };
