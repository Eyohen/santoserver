'use strict';
/** The price a customer pays. A discount is either a percentage off, or the new (discounted) price itself. */
function currentPrice(p) {
  if (!p.discountType || !p.discountValue) return p.price;
  if (p.discountType === 'price') return Math.min(p.price, p.discountValue);
  return Math.max(1, p.price - Math.round((p.price * p.discountValue) / 100));
}
module.exports = { currentPrice };
