const { User } = require('../models');
const { AppError } = require('../utils/errors');
const { Op } = require('sequelize');

class UserService {
  /**
   * Get all users with pagination and filters
   */
  async getAllUsers(filters = {}) {
    const {
      page = 1,
      limit = 10,
      role,
      active,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = filters;

    const offset = (page - 1) * limit;
    const where = {};

    if (role) {
      where.role = role;
    }

    if (active !== undefined) {
      where.active = active;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder]],
      attributes: { exclude: ['password_hash'] }
    });

    return {
      users: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id) {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Create new user
   */
  async createUser(userData) {
    const { email, password, name, role = 'commercial' } = userData;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already in use', 409);
    }

    // Hash password
    const password_hash = await User.hashPassword(password);

    // Create user
    const user = await User.create({
      email,
      password_hash,
      name,
      role,
      active: true
    });

    return user.toJSON();
  }

  /**
   * Update user
   */
  async updateUser(id, userData) {
    const user = await User.findByPk(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { email, password, name, role, active } = userData;

    // Check if new email is already in use
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new AppError('Email already in use', 409);
      }
    }

    const updateData = {};

    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (active !== undefined) updateData.active = active;

    // Hash new password if provided
    if (password) {
      updateData.password_hash = await User.hashPassword(password);
    }

    await user.update(updateData);

    return user.toJSON();
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(id) {
    const user = await User.findByPk(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Soft delete by deactivating
    await user.update({ active: false });

    return { message: 'User deactivated successfully' };
  }

  /**
   * Reset user password
   */
  async resetPassword(id, newPassword) {
    const user = await User.findByPk(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const password_hash = await User.hashPassword(newPassword);
    await user.update({ 
      password_hash,
      failed_login_attempts: 0 
    });

    return { message: 'Password reset successfully' };
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { active: true } });
    const usersByRole = await User.findAll({
      attributes: [
        'role',
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
      ],
      group: ['role']
    });

    return {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      byRole: usersByRole
    };
  }
}

module.exports = new UserService();
