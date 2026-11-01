
// controllers/wishlist.js
const db = require('../models');
const { Wishlist, Product, Category } = db;

const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if already in wishlist
    const existingItem = await Wishlist.findOne({ where: { userId, productId } });
    if (existingItem) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    const wishlistItem = await Wishlist.create({ userId, productId });

    res.status(201).json({
      message: 'Product added to wishlist',
      wishlistItem
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add to wishlist', error: error.message });
  }
};

const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const wishlistItems = await Wishlist.findAll({
      where: { userId },
      include: [
        {
          model: Product,
          as: 'product',
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ wishlistItems });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get wishlist', error: error.message });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const deleted = await Wishlist.destroy({ where: { userId, productId } });

    if (deleted) {
      res.json({ message: 'Product removed from wishlist' });
    } else {
      res.status(404).json({ message: 'Product not found in wishlist' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove from wishlist', error: error.message });
  }
};

const clearWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    await Wishlist.destroy({ where: { userId } });
    res.json({ message: 'Wishlist cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to clear wishlist', error: error.message });
  }
};

module.exports = { addToWishlist, getWishlist, removeFromWishlist, clearWishlist };