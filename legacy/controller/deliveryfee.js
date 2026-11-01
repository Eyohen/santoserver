const db = require('../models');
const { DeliveryFee } = db;
const { Op } = require('sequelize');

// Create a new delivery fee
const create = async (req, res) => {
  try {
    const { state, fee, zone, estimatedDays, isActive } = req.body;

    // Check if state already exists
    const existingFee = await DeliveryFee.findOne({ where: { state } });
    if (existingFee) {
      return res.status(400).json({ message: 'Delivery fee for this state already exists' });
    }

    const deliveryFee = await DeliveryFee.create({
      state,
      fee,
      zone,
      estimatedDays,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      message: 'Delivery fee created successfully',
      deliveryFee
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create delivery fee', error: error.message });
  }
};

// Get all delivery fees with optional filters
const getAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      zone,
      isActive,
      search,
      sortBy = 'state',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Apply filters
    if (zone) where.zone = zone;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.state = { [Op.iLike]: `%${search}%` };
    }

    const deliveryFees = await DeliveryFee.findAndCountAll({
      where,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      deliveryFees: deliveryFees.rows,
      pagination: {
        total: deliveryFees.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(deliveryFees.count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get delivery fees', error: error.message });
  }
};

// Get delivery fee by ID
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const deliveryFee = await DeliveryFee.findByPk(id);

    if (!deliveryFee) {
      return res.status(404).json({ message: 'Delivery fee not found' });
    }

    res.json({ deliveryFee });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get delivery fee', error: error.message });
  }
};

// Get delivery fee by state name
const getByState = async (req, res) => {
  try {
    const { state } = req.params;

    const deliveryFee = await DeliveryFee.findOne({
      where: {
        state: {
          [Op.iLike]: state
        },
        isActive: true
      }
    });

    if (!deliveryFee) {
      return res.status(404).json({ message: 'Delivery fee not found for this state' });
    }

    res.json({ deliveryFee });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get delivery fee', error: error.message });
  }
};

// Get delivery fees by zone
const getByZone = async (req, res) => {
  try {
    const { zone } = req.params;

    const deliveryFees = await DeliveryFee.findAll({
      where: {
        zone,
        isActive: true
      },
      order: [['state', 'ASC']]
    });

    res.json({ deliveryFees });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get delivery fees by zone', error: error.message });
  }
};

// Update delivery fee
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const [updated] = await DeliveryFee.update(updateData, { where: { id } });

    if (updated) {
      const updatedDeliveryFee = await DeliveryFee.findByPk(id);
      res.json({
        message: 'Delivery fee updated successfully',
        deliveryFee: updatedDeliveryFee
      });
    } else {
      res.status(404).json({ message: 'Delivery fee not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to update delivery fee', error: error.message });
  }
};

// Delete delivery fee
const deleteDeliveryFee = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await DeliveryFee.destroy({ where: { id } });

    if (deleted) {
      res.json({ message: 'Delivery fee deleted successfully' });
    } else {
      res.status(404).json({ message: 'Delivery fee not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete delivery fee', error: error.message });
  }
};

// Bulk create delivery fees for all Nigerian states
const bulkCreate = async (req, res) => {
  try {
    const { deliveryFees } = req.body;

    if (!Array.isArray(deliveryFees) || deliveryFees.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of delivery fees' });
    }

    const createdFees = await DeliveryFee.bulkCreate(deliveryFees, {
      validate: true,
      ignoreDuplicates: true
    });

    res.status(201).json({
      message: `${createdFees.length} delivery fees created successfully`,
      deliveryFees: createdFees
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to bulk create delivery fees', error: error.message });
  }
};

module.exports = {
  create,
  getAll,
  getById,
  getByState,
  getByZone,
  update,
  deleteDeliveryFee,
  bulkCreate
};