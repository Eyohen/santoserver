// controller/brand.js - FIXED VERSION
const db = require('../models');
const { Brand, Product } = db;
const { uploadToCloudinary } = require('../middleware/cloudinary');

const create = async (req, res) => {
  try {
    const { name, description, website, country, sortOrder, isFeatured } = req.body;

    let logoUrl = '';
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      if (uploadResult.message === "error") {
        throw new Error(uploadResult.error.message);
      }
      logoUrl = uploadResult.url;
    }

    const brand = await Brand.create({
      name,
      description,
      logoUrl,
      website,
      country,
      isFeatured: isFeatured === 'true',
      sortOrder: sortOrder || 0
    });

    res.status(201).json({
      message: 'Brand created successfully',
      brand
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create brand', error: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const { includeInactive = false, featured } = req.query;
    
    const where = {};
    if (!includeInactive) {
      where.isActive = true;
    }
    if (featured === 'true') {
      where.isFeatured = true;
    }

    const brands = await Brand.findAll({
      where,
      include: [
        {
          model: Product,
          as: 'Product', // FIXED: Use the correct alias from the association
          attributes: ['id'],
          where: { isActive: true },
          required: false
        }
      ],
      order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    });

    // Add product count to each brand
    const brandsWithCount = brands.map(brand => ({
      ...brand.toJSON(),
      productCount: brand.Product ? brand.Product.length : 0, // FIXED: Use correct alias
      Product: undefined // Remove the Product array
    }));

    res.json({ brands: brandsWithCount });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get brands', error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'Product', // FIXED: Use the correct alias
          where: { isActive: true },
          required: false
        }
      ]
    });

    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    res.json({ brand });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get brand', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Convert string boolean to actual boolean
    if (updateData.isFeatured !== undefined) {
      updateData.isFeatured = updateData.isFeatured === 'true';
    }

    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      if (uploadResult.message === "error") {
        throw new Error(uploadResult.error.message);
      }
      updateData.logoUrl = uploadResult.url;
    }

    const [updated] = await Brand.update(updateData, { where: { id } });

    if (updated) {
      const updatedBrand = await Brand.findByPk(id);
      res.json({ message: 'Brand updated successfully', brand: updatedBrand });
    } else {
      res.status(404).json({ message: 'Brand not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to update brand', error: error.message });
  }
};

const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if brand has products - FIXED: Use correct way to count
    const productCount = await Product.count({ 
      where: { brandId: id } 
    });
    
    if (productCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete brand with existing products. Please move or delete products first.'
      });
    }

    const deleted = await Brand.destroy({ where: { id } });

    if (deleted) {
      res.json({ message: 'Brand deleted successfully' });
    } else {
      res.status(404).json({ message: 'Brand not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete brand', error: error.message });
  }
};

const toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findByPk(id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    await brand.update({ isActive: !brand.isActive });

    res.json({ 
      message: `Brand ${brand.isActive ? 'activated' : 'deactivated'} successfully`,
      brand
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle brand status', error: error.message });
  }
};

const toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findByPk(id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    await brand.update({ isFeatured: !brand.isFeatured });

    res.json({ 
      message: `Brand ${brand.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      brand
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle brand featured status', error: error.message });
  }
};

const getFeatured = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const brands = await Brand.findAll({
      where: { isFeatured: true, isActive: true },
      include: [
        {
          model: Product,
          as: 'Product', // FIXED: Use correct alias
          attributes: ['id'],
          where: { isActive: true },
          required: false
        }
      ],
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    // Add product count to each brand
    const brandsWithCount = brands.map(brand => ({
      ...brand.toJSON(),
      productCount: brand.Product ? brand.Product.length : 0,
      Product: undefined
    }));

    res.json({ brands: brandsWithCount });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get featured brands', error: error.message });
  }
};

module.exports = { 
  create, 
  getAll, 
  getById, 
  update, 
  deleteBrand, 
  toggleStatus, 
  toggleFeatured, 
  getFeatured 
};