
// controller/address.js
const db = require('../models');
const { Address } = db;

const create = async (req, res) => {
  try {
    const { type, firstName, lastName, phone, streetAddress, city, state, zipCode, country, isDefault } = req.body;
    const userId = req.user.id;

    // If this is set as default, update all other addresses to not default
    if (isDefault) {
      await Address.update({ isDefault: false }, { where: { userId } });
    }

    const address = await Address.create({
      userId,
      type,
      firstName,
      lastName,
      phone,
      streetAddress,
      city,
      state,
      zipCode,
      country,
      isDefault
    });

    res.status(201).json({
      message: 'Address created successfully',
      address
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create address', error: error.message });
  }
};

const getUserAddresses = async (req, res) => {
  try {
    const userId = req.user.id;

    const addresses = await Address.findAll({
      where: { userId },
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json({ addresses });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get addresses', error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const address = await Address.findOne({ where: { id, userId } });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    res.json({ address });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get address', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    // If this is set as default, update all other addresses to not default
    if (updateData.isDefault) {
      await Address.update({ isDefault: false }, { where: { userId } });
    }

    const [updated] = await Address.update(updateData, { where: { id, userId } });

    if (updated) {
      const updatedAddress = await Address.findByPk(id);
      res.json({ message: 'Address updated successfully', address: updatedAddress });
    } else {
      res.status(404).json({ message: 'Address not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to update address', error: error.message });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deleted = await Address.destroy({ where: { id, userId } });

    if (deleted) {
      res.json({ message: 'Address deleted successfully' });
    } else {
      res.status(404).json({ message: 'Address not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete address', error: error.message });
  }
};

const setDefault = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Set all addresses to not default
    await Address.update({ isDefault: false }, { where: { userId } });

    // Set the selected address as default
    const [updated] = await Address.update({ isDefault: true }, { where: { id, userId } });

    if (updated) {
      res.json({ message: 'Default address updated successfully' });
    } else {
      res.status(404).json({ message: 'Address not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to set default address', error: error.message });
  }
};

module.exports = { create, getUserAddresses, getById, update, deleteAddress, setDefault };