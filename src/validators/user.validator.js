const Joi = require('joi');

const userValidators = {
  createUser: Joi.object({
    email: Joi.string().email().max(255).required().messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).max(100).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'any.required': 'Password is required'
    }),
    name: Joi.string().min(2).max(255).required().messages({
      'string.min': 'Name must be at least 2 characters long',
      'any.required': 'Name is required'
    }),
    role: Joi.string().valid('admin', 'commercial', 'viewer').default('commercial')
  }),

  updateUser: Joi.object({
    email: Joi.string().email().max(255),
    password: Joi.string().min(8).max(100),
    name: Joi.string().min(2).max(255),
    role: Joi.string().valid('admin', 'commercial', 'viewer'),
    active: Joi.boolean()
  }).min(1),

  resetPassword: Joi.object({
    newPassword: Joi.string().min(8).max(100).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'any.required': 'New password is required'
    })
  }),

  queryUsers: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    role: Joi.string().valid('admin', 'commercial', 'viewer'),
    active: Joi.boolean(),
    search: Joi.string().max(255),
    sortBy: Joi.string().valid('name', 'email', 'created_at', 'last_login_at').default('created_at'),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
  })
};

module.exports = userValidators;
