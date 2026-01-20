const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { AppError } = require('../utils/errors');

class AuthService {
  /**
   * Generate JWT token for user
   */
  generateToken(userId, role) {
    return jwt.sign(
      { userId, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId) {
    return jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
  }

  /**
   * Login user with email and password
   */
  async login(email, password, ipAddress = null) {
    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if user is active
    if (!user.active) {
      throw new AppError('Account is inactive', 403);
    }

    // Check if account is locked due to failed attempts
    const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
    if (user.failed_login_attempts >= maxAttempts) {
      throw new AppError('Account is locked due to too many failed login attempts', 423);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Increment failed login attempts
      await user.increment('failed_login_attempts');
      throw new AppError('Invalid email or password', 401);
    }

    // Reset failed login attempts and update last login
    await user.update({
      failed_login_attempts: 0,
      last_login_at: new Date()
    });

    // Generate tokens
    const accessToken = this.generateToken(user.id, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

      if (decoded.type !== 'refresh') {
        throw new AppError('Invalid refresh token', 401);
      }

      const user = await User.findByPk(decoded.userId);

      if (!user || !user.active) {
        throw new AppError('User not found or inactive', 401);
      }

      const accessToken = this.generateToken(user.id, user.role);

      return { accessToken };
    } catch (error) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  /**
   * Verify token and return user
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);

      if (!user || !user.active) {
        throw new AppError('User not found or inactive', 401);
      }

      return user;
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }
  }

  /**
   * Logout (can be extended to blacklist tokens)
   */
  async logout(userId) {
    // In a production app, you might want to:
    // - Blacklist the token
    // - Remove refresh token from database
    // - Clear any cached sessions
    return { message: 'Logged out successfully' };
  }
}

module.exports = new AuthService();
