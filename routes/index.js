'use strict';
const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { requireAuth, optionalAuth, requireAdmin } = require('../middleware/auth');
const auth = require('../controllers/auth');
const catalogue = require('../controllers/catalogue');
const checkout = require('../controllers/checkout');
const pub = require('../controllers/public');
const admin = require('../controllers/admin');

const router = express.Router();
const limit = (max, windowMs = 15 * 60 * 1000) =>
  rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many attempts. Try again shortly.' } });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

/* Storefront */
router.get('/products', catalogue.listProducts);
router.get('/products/:slug', catalogue.getProduct);
router.get('/categories', catalogue.listCategories);
router.get('/delivery-fees', catalogue.listDeliveryFees);
router.post('/discounts/validate', limit(60), pub.validateDiscount);
router.post('/custom-requests', limit(10), pub.createCustomRequest);

router.post('/checkout/quote', limit(120), checkout.quote);
router.post('/checkout', limit(30), optionalAuth, checkout.checkout);
router.post('/payments/verify', limit(120), checkout.verify);
router.get('/orders/track', limit(30), checkout.track);
router.get('/orders/mine', requireAuth, checkout.myOrders);

router.post('/auth/register', limit(20), auth.register);
router.post('/auth/login', limit(20), auth.login);
router.get('/auth/me', requireAuth, auth.me);

/* Admin */
const a = express.Router();
a.use(requireAuth, requireAdmin);
a.get('/stats', admin.stats);
a.get('/orders', admin.listOrders);
a.get('/orders/:id', admin.getOrder);
a.patch('/orders/:id', admin.updateOrder);
a.get('/transactions', admin.listTransactions);
a.get('/customers', admin.listCustomers);
a.get('/categories', admin.listCategories);
a.get('/products', admin.listProducts);
a.post('/products', admin.createProduct);
a.put('/products/:id', admin.updateProduct);
a.delete('/products/:id', admin.deleteProduct);
a.patch('/variants/:sku/stock', admin.setStock);
a.post('/uploads', upload.single('image'), admin.upload);
a.get('/delivery-fees', admin.listFees);
a.post('/delivery-fees', admin.saveFee);
a.put('/delivery-fees/:id', admin.saveFee);
a.delete('/delivery-fees/:id', admin.deleteFee);
a.get('/discounts', admin.listDiscounts);
a.post('/discounts', admin.saveDiscount);
a.put('/discounts/:id', admin.saveDiscount);
a.delete('/discounts/:id', admin.deleteDiscount);
a.get('/custom-requests', admin.listCustomRequests);
a.patch('/custom-requests/:id', admin.updateCustomRequest);
router.use('/admin', a);

module.exports = router;
