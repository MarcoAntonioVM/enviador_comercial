const { User } = require('../models');
const { AppError } = require('../utils/errors');
const { Op } = require('sequelize');

class UserService {

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
    
    // Default: only active users
    if (active === undefined) {
      where.active = true;
    }

    if (role) {
      where.role = role;
    }

    if (active !== undefined) {
      where.active = active === 'true' || active === true;
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


  async getUserById(id) {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }


  async createUser(userData) {
    const { email, password, name, role = 'commercial' } = userData;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already in use', 409);
    }

    const password_hash = await User.hashPassword(password);

    const user = await User.create({
      email,
      password_hash,
      name,
      role,
      active: true
    });

    const data = user.toJSON();
    delete data.password_hash;

    return data;
  }


  async updateUser(id, userData) {
    const user = await User.findByPk(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { email, password, name, role, active } = userData;

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

    if (active !== undefined) {
      updateData.active = active;
    }

    if (password) {
      updateData.password_hash = await User.hashPassword(password);
    }

    await user.update(updateData);

    const data = user.toJSON();
    delete data.password_hash;

    return data;
  }


  async deleteUser(id) {
    const user = await User.findByPk(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    await user.update({ active: false });

    return { message: 'User deactivated successfully' };
  }


  async reactivateUser(id) {
    const user = await User.findByPk(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    await user.update({ active: true });

    return { message: 'User reactivated successfully' };
  }


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


  async getUserStats() {
    const totalUsers = await User.count();

    const activeUsers = await User.count({
      where: { active: true }
    });

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
