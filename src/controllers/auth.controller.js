const authService = require('../services/auth.service');
const { successResponse } = require('../utils/response');
const { AppError } = require('../utils/errors');

class AuthController {
  /**
   * Login
   * POST /api/v1/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;

      const result = await authService.login(email, password, ipAddress);

      successResponse(res, result, 'Login successful', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh token
   * POST /api/v1/auth/refresh
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
      }

      const result = await authService.refreshToken(refreshToken);

      successResponse(res, result, 'Token refreshed successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout
   * POST /api/v1/auth/logout
   */
  async logout(req, res, next) {
    try {
      const userId = req.userId;

      const result = await authService.logout(userId);

      successResponse(res, result, 'Logout successful', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   * GET /api/v1/auth/me
   */
  async getCurrentUser(req, res, next) {
    try {
      const user = req.user.toJSON();

      successResponse(res, { user }, 'User retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * POST /api/v1/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user;

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        throw new AppError('Current password is incorrect', 400);
      }

      // Hash and update new password
      const { User } = require('../models');
      const password_hash = await User.hashPassword(newPassword);
      await user.update({ password_hash });

      successResponse(res, null, 'Password changed successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
