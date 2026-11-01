// controller/product.js 
const db = require('../models');
const { Product, Category, Review, User } = db;
const { uploadToCloudinary } = require('../middleware/cloudinary');
const { Op } = require('sequelize');

// Safely get Brand model if it exists
const Brand = db.Brand || null;

const create = async (req, res) => {
  try {
    const {
      name, description, price, originalPrice, categoryId, brandId,
      flavors, sizes, nutritionFacts, ingredients, stockQuantity,
      weight, sku, tags, flavour
    } = req.body;

    let imageUrl = null;

    // Handle single image upload
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      if (uploadResult.message === "error") {
        throw new Error(uploadResult.error.message);
      }
      imageUrl = uploadResult.url;
    }

    const generatedSku = sku || `PRO-${Date.now()}`;

    const product = await Product.create({
      name,
      description,
      price,
      originalPrice,
      categoryId,
      brandId: brandId || null,
      imageUrl,
      images: [],
      flavors: flavors ? JSON.parse(flavors) : null,
      sizes: sizes ? JSON.parse(sizes) : null,
      nutritionFacts: nutritionFacts ? JSON.parse(nutritionFacts) : null,
      ingredients,
      flavour: flavour || null,
      stockQuantity: stockQuantity || 0,
      weight,
      sku: generatedSku,
      tags: tags ? JSON.parse(tags) : null
    });

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      brand,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      minPrice,
      maxPrice,
      inStock,
      featured
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Apply filters
    if (category) where.categoryId = category;
    if (brand && Brand) where.brandId = brand; // Only filter by brand if Brand model exists
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (minPrice) where.price = { [Op.gte]: minPrice };
    if (maxPrice) where.price = { ...where.price, [Op.lte]: maxPrice };
    if (inStock === 'true') where.stockQuantity = { [Op.gt]: 0 };
    if (featured === 'true') where.isFeatured = true;

    // Build include array conditionally
    const includeArray = [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      },
      {
        model: Review,
        as: 'reviews',
        attributes: ['rating'],
        separate: true
      }
    ];

    // Only include Brand if the model exists and has the required fields
    if (Brand) {
      try {
        // Test if logoUrl column exists by checking model attributes
        const brandAttributes = ['id', 'name'];

        // Check if logoUrl column exists in the Brand model
        if (Brand.rawAttributes && Brand.rawAttributes.logoUrl) {
          brandAttributes.push('logoUrl');
        }

        includeArray.push({
          model: Brand,
          as: 'brand',
          attributes: brandAttributes,
          required: false
        });
      } catch (error) {
        console.warn('Brand association issue:', error.message);
        // Continue without Brand association
      }
    }

    const products = await Product.findAndCountAll({
      where,
      include: includeArray,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      products: products.rows,
      pagination: {
        total: products.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(products.count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get products', error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;

    // Build include array conditionally
    const includeArray = [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      },
      {
        model: Review,
        as: 'reviews',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName']
          }
        ]
      }
    ];

    // Only include Brand if model exists
    if (Brand) {
      try {
        const brandAttributes = ['id', 'name'];
        if (Brand.rawAttributes && Brand.rawAttributes.logoUrl) {
          brandAttributes.push('logoUrl');
        }
        if (Brand.rawAttributes && Brand.rawAttributes.website) {
          brandAttributes.push('website');
        }
        if (Brand.rawAttributes && Brand.rawAttributes.country) {
          brandAttributes.push('country');
        }

        includeArray.push({
          model: Brand,
          as: 'brand',
          attributes: brandAttributes,
          required: false
        });
      } catch (error) {
        console.warn('Brand association issue in getById:', error.message);
      }
    }

    const product = await Product.findByPk(id, {
      include: includeArray
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get product', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Handle image upload
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      if (uploadResult.message === "error") {
        throw new Error(uploadResult.error.message);
      }
      updateData.imageUrl = uploadResult.url;
    }

    // Parse JSON fields
    if (updateData.flavors) updateData.flavors = JSON.parse(updateData.flavors);
    if (updateData.sizes) updateData.sizes = JSON.parse(updateData.sizes);
    if (updateData.nutritionFacts) updateData.nutritionFacts = JSON.parse(updateData.nutritionFacts);
    if (updateData.tags) updateData.tags = JSON.parse(updateData.tags);

    // Handle brandId - allow null/empty values
    if (updateData.brandId === '' || updateData.brandId === 'null') {
      updateData.brandId = null;
    }

    const [updated] = await Product.update(updateData, { where: { id } });

    if (updated) {
      // Build include array for response
      const includeArray = [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ];

      if (Brand) {
        try {
          const brandAttributes = ['id', 'name'];
          if (Brand.rawAttributes && Brand.rawAttributes.logoUrl) {
            brandAttributes.push('logoUrl');
          }

          includeArray.push({
            model: Brand,
            as: 'brand',
            attributes: brandAttributes,
            required: false
          });
        } catch (error) {
          console.warn('Brand association issue in update:', error.message);
        }
      }

      const updatedProduct = await Product.findByPk(id, {
        include: includeArray
      });

      res.json({ message: 'Product updated successfully', product: updatedProduct });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // If product has order items, preserve product name in order history before deleting
    if (db.OrderItem) {
      const orderItems = await db.OrderItem.findAll({ where: { productId: id } });
      if (orderItems.length > 0) {
        // Save product name to order items so order history is preserved
        await db.OrderItem.update(
          { productName: product.name, productId: null },
          { where: { productId: id } }
        );
      }
    }

    // Delete associated data first to avoid foreign key constraints
    try {
      // Delete reviews
      if (Review) {
        await Review.destroy({ where: { productId: id } });
      }

      // Delete cart items (model is named 'Cart', not 'CartItem')
      if (db.Cart) {
        await db.Cart.destroy({ where: { productId: id } });
      }

      // Delete wishlist items (if Wishlist model exists)
      if (db.Wishlist) {
        await db.Wishlist.destroy({ where: { productId: id } });
      }

    } catch (cleanupError) {
      console.log('Error cleaning up associated records:', cleanupError.message);
      // Continue with deletion attempt
    }

    // Delete the product
    const deleted = await Product.destroy({ where: { id } });

    if (deleted) {
      res.json({
        message: 'Product deleted successfully',
        productId: id
      });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      message: error.name === 'SequelizeForeignKeyConstraintError'
        ? 'Cannot delete product: it has related records in the database'
        : 'Failed to delete product',
      error: error.message
    });
  }
};

const getFeatured = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const includeArray = [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      }
    ];

    if (Brand) {
      try {
        const brandAttributes = ['id', 'name'];
        if (Brand.rawAttributes && Brand.rawAttributes.logoUrl) {
          brandAttributes.push('logoUrl');
        }

        includeArray.push({
          model: Brand,
          as: 'brand',
          attributes: brandAttributes,
          required: false
        });
      } catch (error) {
        console.warn('Brand association issue in getFeatured:', error.message);
      }
    }

    const products = await Product.findAll({
      where: { isFeatured: true, isActive: true },
      include: includeArray,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get featured products', error: error.message });
  }
};

const getByBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

    if (!Brand) {
      return res.status(400).json({ message: 'Brand functionality not available' });
    }

    const offset = (page - 1) * limit;

    const includeArray = [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      }
    ];

    const brandAttributes = ['id', 'name'];
    if (Brand.rawAttributes && Brand.rawAttributes.logoUrl) {
      brandAttributes.push('logoUrl');
    }

    includeArray.push({
      model: Brand,
      as: 'brand',
      attributes: brandAttributes,
      required: false
    });

    const products = await Product.findAndCountAll({
      where: {
        brandId,
        isActive: true
      },
      include: includeArray,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      products: products.rows,
      pagination: {
        total: products.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(products.count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get products by brand', error: error.message });
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  deleteProduct,
  getFeatured,
  getByBrand
};