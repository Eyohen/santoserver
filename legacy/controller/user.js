// controller/user.js
const db = require('../models');
const { User, Order, Review, Address } = db;
const { Op } = require('sequelize');

const getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      role = '', 
      status = '', 
      sortBy = 'createdAt', 
      sortOrder = 'DESC' 
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Apply filters
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (role === 'admin') {
      where.isAdmin = true;
    } else if (role === 'customer') {
      where.isAdmin = false;
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const users = await User.findAndCountAll({
      where,
      attributes: { 
        exclude: ['password', 'verificationToken', 'resetPasswordToken', 'resetPasswordExpires'] 
      },
      include: [
        {
          model: Order,
          as: 'orders',
          attributes: ['id', 'total', 'status'],
          required: false
        },
        {
          model: Review,
          as: 'reviews',
          attributes: ['id', 'rating'],
          required: false
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate additional user stats
    const usersWithStats = users.rows.map(user => {
      const userObj = user.toJSON();
      userObj.totalOrders = user.orders?.length || 0;
      userObj.totalSpent = user.orders?.reduce((sum, order) => sum + parseFloat(order.total || 0), 0) || 0;
      userObj.averageRating = user.reviews?.length > 0 
        ? (user.reviews.reduce((sum, review) => sum + review.rating, 0) / user.reviews.length).toFixed(1)
        : 0;
      userObj.totalReviews = user.reviews?.length || 0;
      
      // Remove the orders and reviews arrays from response to keep it clean
      delete userObj.orders;
      delete userObj.reviews;
      
      return userObj;
    });

    res.json({
      users: usersWithStats,
      pagination: {
        total: users.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(users.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to get users', error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { 
        exclude: ['password', 'verificationToken', 'resetPasswordToken', 'resetPasswordExpires'] 
      },
      include: [
        {
          model: Order,
          as: 'orders',
          include: [
            {
              model: db.OrderItem,
              as: 'orderItems',
              include: [
                {
                  model: db.Product,
                  as: 'product',
                  attributes: ['name', 'imageUrl']
                }
              ]
            }
          ]
        },
        {
          model: Review,
          as: 'reviews',
          include: [
            {
              model: db.Product,
              as: 'product',
              attributes: ['name', 'imageUrl']
            }
          ]
        },
        {
          model: Address,
          as: 'addresses'
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate user statistics
    const userStats = {
      totalOrders: user.orders?.length || 0,
      totalSpent: user.orders?.reduce((sum, order) => sum + parseFloat(order.total || 0), 0) || 0,
      averageOrderValue: user.orders?.length > 0 
        ? (user.orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0) / user.orders.length)
        : 0,
      totalReviews: user.reviews?.length || 0,
      averageRating: user.reviews?.length > 0 
        ? (user.reviews.reduce((sum, review) => sum + review.rating, 0) / user.reviews.length)
        : 0,
      totalAddresses: user.addresses?.length || 0
    };

    res.json({ 
      user: user.toJSON(), 
      stats: userStats 
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to get user', error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, isAdmin, isActive, dateOfBirth } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;

    await user.update(updateData);

    const updatedUser = await User.findByPk(id, {
      attributes: { 
        exclude: ['password', 'verificationToken', 'resetPasswordToken', 'resetPasswordExpires'] 
      }
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deletion of admin users by non-super-admin
    if (user.isAdmin && !req.user.isSuperAdmin) {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    // Check if user has orders
    const orderCount = await Order.count({ where: { userId: id } });
    if (orderCount > 0) {
      // Instead of deleting, deactivate the user
      await user.update({ isActive: false });
      return res.json({ message: 'User deactivated due to existing orders' });
    }

    // Safe to delete user with no orders
    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

const getUserStats = async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.count();
    
    // Active users
    const activeUsers = await User.count({ where: { isActive: true } });
    
    // Admin users
    const adminUsers = await User.count({ where: { isAdmin: true } });
    
    // New users this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const newUsersThisMonth = await User.count({
      where: {
        createdAt: { [Op.gte]: thisMonth }
      }
    });

    // Users with orders
    const usersWithOrders = await User.count({
      include: [
        {
          model: Order,
          as: 'orders',
          required: true
        }
      ]
    });

    // Top customers by spending
    const topCustomers = await User.findAll({
      attributes: [
        'id', 'firstName', 'lastName', 'email',
        [db.sequelize.fn('COUNT', db.sequelize.col('orders.id')), 'orderCount'],
        [db.sequelize.fn('SUM', db.sequelize.col('orders.total')), 'totalSpent']
      ],
      include: [
        {
          model: Order,
          as: 'orders',
          attributes: [],
          where: { status: { [Op.not]: 'cancelled' } }
        }
      ],
      group: ['User.id'],
      order: [[db.sequelize.fn('SUM', db.sequelize.col('orders.total')), 'DESC']],
      limit: 10
    });

    res.json({
      totalUsers,
      activeUsers,
      adminUsers,
      newUsersThisMonth,
      usersWithOrders,
      topCustomers
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Failed to get user stats', error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: 'New password is required and must be at least 6 characters long'
      });
    }

    // Find the user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update password (will be automatically hashed by the beforeUpdate hook)
    await user.update({ password: newPassword });

    res.json({
      message: 'Password changed successfully',
      userId: user.id
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Failed to change password', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
  changePassword
};