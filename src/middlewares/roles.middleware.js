const { AppError } = require('../utils/errors');

/**
 * Middleware to check if user has required role(s)
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.userRole) {
        throw new AppError('Authentication required', 401);
      }

      if (!allowedRoles.includes(req.userRole)) {
        throw new AppError('Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user is admin
 */
const isAdmin = authorize('admin');

/**
 * Middleware to check if user is admin or commercial
 */
const isCommercialOrAdmin = authorize('admin', 'commercial');

/**
 * Middleware to check if user can modify resource
 * Admins can modify anything, others can only modify their own resources
 */
const canModifyResource = (resourceUserIdField = 'created_by') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      // Admins can modify anything
      if (req.userRole === 'admin') {
        return next();
      }

      // Check if resource belongs to user
      const resourceUserId = req.resource ? req.resource[resourceUserIdField] : null;
      
      if (!resourceUserId || resourceUserId !== req.userId) {
        throw new AppError('Cannot modify this resource', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { 
  authorize, 
  isAdmin, 
  isCommercialOrAdmin,
  canModifyResource 
};
