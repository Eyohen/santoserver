
// controllers/review.js
const db = require('../models');
const { Review, Product, User } = db;

const create = async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body;
    const userId = req.user.id;

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({ where: { userId, productId } });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    const review = await Review.create({
      userId,
      productId,
      rating,
      title,
      comment
    });

    // Update product rating
    await updateProductRating(productId);

    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create review', error: error.message });
  }
};

const updateProductRating = async (productId) => {
  try {
    const reviews = await Review.findAll({ where: { productId } });
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await Product.update(
      { 
        rating: averageRating.toFixed(1),
        reviewCount: reviews.length
      },
      { where: { id: productId } }
    );
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
};

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;

    const where = { productId, isApproved: true };
    if (rating) where.rating = rating;

    const reviews = await Review.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    res.json({
      reviews: reviews.rows,
      pagination: {
        total: reviews.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(reviews.count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get reviews', error: error.message });
  }
};

const getUserReviews = async (req, res) => {
  try {
    const userId = req.user.id;

    const reviews = await Review.findAll({
      where: { userId },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'imageUrl']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user reviews', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user.id;

    const [updated] = await Review.update(
      { rating, title, comment },
      { where: { id, userId } }
    );

    if (updated) {
      const updatedReview = await Review.findByPk(id);
      
      // Update product rating
      await updateProductRating(updatedReview.productId);

      res.json({ message: 'Review updated successfully', review: updatedReview });
    } else {
      res.status(404).json({ message: 'Review not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to update review', error: error.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const review = await Review.findOne({ where: { id, userId } });
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await review.destroy();

    // Update product rating
    await updateProductRating(review.productId);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete review', error: error.message });
  }
};

module.exports = { create, getProductReviews, getUserReviews, update, deleteReview };