// controller/discount.js
const db = require('../models');
const { Discount, DiscountUsage, Order, User } = db;
const { Op } = require('sequelize');

// Generate discount code
const generateDiscountCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Create discount
const createDiscount = async (req, res) => {
  try {
    const {
      code: customCode,
      name,
      description,
      value,
      type = 'percentage',
      minOrderAmount = 0,
      maxDiscountAmount,
      usageLimit,
      userUsageLimit = 1,
      validUntil
    } = req.body;

    const adminId = req.user.id;

    // Use custom code if provided, otherwise generate one
    let code;
    if (customCode) {
      // Validate custom code format
      const codeRegex = /^[A-Z0-9]{4,20}$/;
      const trimmedCode = customCode.trim().toUpperCase();

      if (!codeRegex.test(trimmedCode)) {
        return res.status(400).json({
          message: 'Discount code must be 4-20 characters long and contain only uppercase letters and numbers'
        });
      }

      // Check if code already exists
      const existingDiscount = await Discount.findOne({ where: { code: trimmedCode } });
      if (existingDiscount) {
        return res.status(400).json({
          message: 'Discount code already exists. Please choose a different code.'
        });
      }

      code = trimmedCode;
    } else {
      // Generate unique code
      let codeExists = true;
      while (codeExists) {
        code = generateDiscountCode();
        const existingDiscount = await Discount.findOne({ where: { code } });
        codeExists = !!existingDiscount;
      }
    }

    const discount = await Discount.create({
      code,
      name,
      description,
      type,
      value,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      userUsageLimit,
      validUntil,
      createdBy: adminId
    });

    res.status(201).json({
      message: 'Discount code created successfully',
      discount
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to create discount code', 
      error: error.message 
    });
  }
};

// Get all discounts
const getAllDiscounts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      isActive, 
      type,
      search 
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (type) where.type = type;
    if (search) {
      where[Op.or] = [
        { code: { [Op.iLike]: `%${search}%` } },
        { name: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const discounts = await Discount.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['firstName', 'lastName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      discounts: discounts.rows,
      pagination: {
        total: discounts.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(discounts.count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to get discount codes', 
      error: error.message 
    });
  }
};

// Get discount by ID
const getDiscountById = async (req, res) => {
  try {
    const { id } = req.params;

    const discount = await Discount.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['firstName', 'lastName', 'email']
        }
      ]
    });

    if (!discount) {
      return res.status(404).json({ message: 'Discount code not found' });
    }

    res.json({ discount });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to get discount code', 
      error: error.message 
    });
  }
};

// Update discount
const updateDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // If code is being updated, validate it
    if (updateData.code) {
      const codeRegex = /^[A-Z0-9]{4,20}$/;
      const trimmedCode = updateData.code.trim().toUpperCase();

      if (!codeRegex.test(trimmedCode)) {
        return res.status(400).json({
          message: 'Discount code must be 4-20 characters long and contain only uppercase letters and numbers'
        });
      }

      // Check if the new code is already used by another discount
      const existingDiscount = await Discount.findOne({
        where: {
          code: trimmedCode,
          id: { [Op.ne]: id } // Exclude current discount from check
        }
      });

      if (existingDiscount) {
        return res.status(400).json({
          message: 'Discount code already exists. Please choose a different code.'
        });
      }

      updateData.code = trimmedCode;
    }

    const [updated] = await Discount.update(updateData, {
      where: { id }
    });

    if (updated) {
      const updatedDiscount = await Discount.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['firstName', 'lastName', 'email']
          }
        ]
      });
      res.json({
        message: 'Discount code updated successfully',
        discount: updatedDiscount
      });
    } else {
      res.status(404).json({ message: 'Discount code not found' });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update discount code',
      error: error.message
    });
  }
};

// Delete discount
const deleteDiscount = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Discount.destroy({ where: { id } });

    if (deleted) {
      res.json({ message: 'Discount code deleted successfully' });
    } else {
      res.status(404).json({ message: 'Discount code not found' });
    }
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to delete discount code', 
      error: error.message 
    });
  }
};

// Toggle discount status
const toggleDiscountStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const discount = await Discount.findByPk(id);
    if (!discount) {
      return res.status(404).json({ message: 'Discount code not found' });
    }

    await discount.update({ isActive: !discount.isActive });

    res.json({ 
      message: `Discount code ${discount.isActive ? 'activated' : 'deactivated'} successfully`,
      discount
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to toggle discount status', 
      error: error.message 
    });
  }
};

// Validate discount code (for frontend use)
const validateDiscountCode = async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!code) {
      return res.status(400).json({ message: 'Discount code is required' });
    }

    const discount = await Discount.findOne({ 
      where: { 
        code: code.toUpperCase(),
        isActive: true,
        validFrom: { [Op.lte]: new Date() },
        [Op.or]: [
          { validUntil: null },
          { validUntil: { [Op.gte]: new Date() } }
        ]
      }
    });

    if (!discount) {
      return res.status(404).json({ message: 'Invalid or expired discount code' });
    }

    // Check minimum order amount
    if (subtotal < discount.minOrderAmount) {
      return res.status(400).json({
        message: `Minimum order amount of ₦${discount.minOrderAmount} required for this discount`
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = (subtotal * discount.value) / 100;
    } else {
      discountAmount = discount.value;
    }

    // Apply maximum discount limit
    if (discount.maxDiscountAmount && discountAmount > discount.maxDiscountAmount) {
      discountAmount = discount.maxDiscountAmount;
    }

    res.json({
      valid: true,
      discount: {
        id: discount.id,
        code: discount.code,
        name: discount.name,
        type: discount.type,
        value: discount.value,
        discountAmount: parseFloat(discountAmount.toFixed(2))
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to validate discount code', 
      error: error.message 
    });
  }
};

// Create quick discount (5%, 10%, 15%, 20%, 25%)
const createQuickDiscount = async (req, res) => {
  try {
    const { percentage, name, description, validUntil, code: customCode } = req.body;
    const adminId = req.user.id;

    // Validate percentage
    const allowedPercentages = [5, 10, 15, 20, 25];
    if (!allowedPercentages.includes(percentage)) {
      return res.status(400).json({
        message: 'Invalid percentage. Allowed values: 5, 10, 15, 20, 25'
      });
    }

    // Use custom code if provided, otherwise generate one
    let code;
    if (customCode) {
      // Validate custom code format
      const codeRegex = /^[A-Z0-9]{4,20}$/;
      const trimmedCode = customCode.trim().toUpperCase();

      if (!codeRegex.test(trimmedCode)) {
        return res.status(400).json({
          message: 'Discount code must be 4-20 characters long and contain only uppercase letters and numbers'
        });
      }

      // Check if code already exists
      const existingDiscount = await Discount.findOne({ where: { code: trimmedCode } });
      if (existingDiscount) {
        return res.status(400).json({
          message: 'Discount code already exists. Please choose a different code.'
        });
      }

      code = trimmedCode;
    } else {
      // Generate unique code
      let codeExists = true;
      while (codeExists) {
        code = `SAVE${percentage}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        const existingDiscount = await Discount.findOne({ where: { code } });
        codeExists = !!existingDiscount;
      }
    }

    const discount = await Discount.create({
      code,
      name: name || `${percentage}% Off`,
      description: description || `Get ${percentage}% off your order`,
      type: 'percentage',
      value: percentage,
      minOrderAmount: 0,
      userUsageLimit: 1,
      validUntil,
      createdBy: adminId
    });

    res.status(201).json({
      message: 'Quick discount created successfully',
      discount
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to create quick discount', 
      error: error.message 
    });
  }
};

module.exports = {
  createDiscount,
  getAllDiscounts,
  getDiscountById,
  updateDiscount,
  deleteDiscount,
  toggleDiscountStatus,
  validateDiscountCode,
  createQuickDiscount
};