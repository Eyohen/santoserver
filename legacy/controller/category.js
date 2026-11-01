
// controller/category.js
const db = require('../models');
const { Category, Product } = db;
const { uploadToCloudinary } = require('../middleware/cloudinary');

const create = async (req, res) => {
  try {
    const { name, description, sortOrder } = req.body;

    let imageUrl = '';
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      if (uploadResult.message === "error") {
        throw new Error(uploadResult.error.message);
      }
      imageUrl = uploadResult.url;
    }

    const category = await Category.create({
      name,
      description,
      imageUrl,
      sortOrder: sortOrder || 0
    });

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create category', error: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['id'],
          where: { isActive: true },
          required: false
        }
      ],
      order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    });

    // Add product count to each category
    const categoriesWithCount = categories.map(category => ({
      ...category.toJSON(),
      productCount: category.products.length,
      products: undefined // Remove the products array
    }));

    res.json({ categories: categoriesWithCount });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get categories', error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'products',
          where: { isActive: true },
          required: false
        }
      ]
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ category });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get category', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      if (uploadResult.message === "error") {
        throw new Error(uploadResult.error.message);
      }
      updateData.imageUrl = uploadResult.url;
    }

    const [updated] = await Category.update(updateData, { where: { id } });

    if (updated) {
      const updatedCategory = await Category.findByPk(id);
      res.json({ message: 'Category updated successfully', category: updatedCategory });
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to update category', error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has products
    const productCount = await Product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with existing products. Please move or delete products first.' 
      });
    }

    const deleted = await Category.destroy({ where: { id } });

    if (deleted) {
      res.json({ message: 'Category deleted successfully' });
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete category', error: error.message });
  }
};

module.exports = { create, getAll, getById, update, deleteCategory };