'use strict';
/** The price a customer pays: the listed price less the product's discount, if it has one. */
function currentPrice(p) {
  if (!p.discountType || !p.discountValue) return p.price;
  const off = p.discountType === 'percent' ? Math.round((p.price * p.discountValue) / 100) : p.discountValue;
  return Math.max(1, p.price - off);
}
module.exports = { currentPrice };
