const userService = require('../services/user.service');
const { successResponse, paginatedResponse } = require('../utils/response');
const { AppError } = require('../utils/errors');

class UserController {
  /**
   * Get all users
   * GET /api/v1/users
   */
  async getAllUsers(req, res, next) {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        role: req.query.role,
        active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
        search: req.query.search,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      };

      const result = await userService.getAllUsers(filters);

      paginatedResponse(
        res,
        result.users,
        result.pagination,
        'Users retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   * GET /api/v1/users/:id
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      successResponse(res, { user }, 'User retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create user
   * POST /api/v1/users
   */
  async createUser(req, res, next) {
    try {
      const userData = req.body;

      if (!userData.email || !userData.password || !userData.name) {
        throw new AppError('Email, password and name are required', 400);
      }
      if (userData.password.length < 6) {
        throw new AppError('Password must be at least 6 characters', 400);
      }

      const user = await userService.createUser(userData);

      successResponse(res, { user }, 'User created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user
   * PUT /api/v1/users/:id
   */
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const userData = req.body;

      const user = await userService.updateUser(id, userData);

      successResponse(res, { user }, 'User updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user (soft delete)
   * DELETE /api/v1/users/:id
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const result = await userService.deleteUser(id);

      successResponse(res, result, 'User deactivated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reactivate user (after soft delete)
   * POST /api/v1/users/:id/reactivate
   */
  async reactivateUser(req, res, next) {
    try {
      const { id } = req.params;
      const result = await userService.reactivateUser(id);

      successResponse(res, result, 'User reactivated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset user password
   * POST /api/v1/users/:id/reset-password
   */
  async resetPassword(req, res, next) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        throw new AppError('New password is required', 400);
      }
      if (newPassword.length < 6) {
        throw new AppError('Password must be at least 6 characters', 400);
      }

      const result = await userService.resetPassword(id, newPassword);

      successResponse(res, result, 'Password reset successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user statistics
   * GET /api/v1/users/stats
   */
  async getUserStats(req, res, next) {
    try {
      const stats = await userService.getUserStats();

      successResponse(res, stats, 'User statistics retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
