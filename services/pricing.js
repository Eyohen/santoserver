'use strict';
/**
 * The price a customer pays. A discount is either a percentage off (1-90) or the new discounted price itself.
 * Fails closed: anything unrecognised or out of range charges the full listed price.
 */
function currentPrice(p) {
  const v = Number(p.discountValue);
  if (!Number.isInteger(v) || v < 1) return p.price;
  if (p.discountType === 'price') return v < p.price ? v : p.price;
  if (p.discountType === 'percent' && v <= 90) return Math.max(1, p.price - Math.round((p.price * v) / 100));
  return p.price;
}
module.exports = { currentPrice };
