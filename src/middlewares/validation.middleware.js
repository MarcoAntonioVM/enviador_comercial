const Joi = require('joi');
const { AppError } = require('../utils/errors');

/**
 * Middleware to validate request data using Joi schema
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Property to validate ('body', 'query', 'params')
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      return next(new AppError(errorMessage, 400));
    }

    // Replace request property with validated value
    req[property] = value;
    next();
  };
};

// Common validation schemas
const commonValidations = {
  id: Joi.number().integer().positive().required(),
  email: Joi.string().email().max(255).required(),
  optionalEmail: Joi.string().email().max(255),
  password: Joi.string().min(8).max(100).required(),
  name: Joi.string().min(2).max(255).required(),
  phone: Joi.string().max(50),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC')
  })
};

module.exports = { validate, commonValidations };
