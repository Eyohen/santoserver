//index.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const db = require('./models');

// Route imports
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const categoryRoutes = require('./routes/category');
const brandRoutes = require('./routes/brand');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/order');
const paymentRoutes = require('./routes/payment');
const addressRoutes = require('./routes/address');
const reviewRoutes = require('./routes/review');
const wishlistRoutes = require('./routes/wishlist');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/user');
const discountRoutes = require('./routes/discount');
const deliveryFeeRoutes = require('./routes/deliveryfee');
const webhookRoutes = require('./routes/webhook');



const app = express();
const port = process.env.API_PORT || 9000;
app.use(cors());

app.use(helmet());
app.use(morgan('combined'));

// Webhook routes need raw body for signature verification
// Must be registered BEFORE express.json() middleware
app.use('/api/webhooks', express.raw({ type: 'application/json' }), (req, res, next) => {
  // Store raw body and parse JSON for the webhook handler
  if (req.body && Buffer.isBuffer(req.body)) {
    req.rawBody = req.body.toString('utf8');
    try {
      req.body = JSON.parse(req.rawBody);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid JSON' });
    }
  }
  next();
}, webhookRoutes);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Protein Goodies API is running',
    timestamp: new Date().toISOString()
  });
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/discounts', discountRoutes); 
app.use('/api/delivery-fees', deliveryFeeRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Database connection and server startup
db.sequelize
  .authenticate()
  .then(() => {
    console.log(`✅ Database connection established successfully... ${process.env.NODE_ENV}`);

    // Sync models with database (alter: true adds new columns without dropping data)
    return db.sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('✅ All models synchronized successfully');
    
    // Start server
    app.listen(port, () => {
      console.log(`🚀 Protein Goodies API listening on port ${port}`);
      console.log(`🌍 Health check: http://localhost:${port}/api/health`);
    });
  })
  .catch((err) => {
    console.error('❌ Unable to connect to the database:', err.message);
    
    if (err.name === 'SequelizeConnectionError' || err.name === 'SequelizeConnectionRefusedError') {
      console.error('📡 Database connection refused. Please check your database configuration.');
    } else {
      console.error('💥 Database error:', err.message);
    }
    
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
