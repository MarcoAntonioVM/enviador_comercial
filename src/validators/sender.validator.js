const Joi = require('joi');

const senderValidators = {
  // Validación para crear un sender individual
  createSender: Joi.object({
    name: Joi.string().min(2).max(255).required().messages({
      'string.min': 'Name must be at least 2 characters',
      'any.required': 'Name is required'
    }),
    email: Joi.string().email().max(255).required().messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required'
    }),
    reply_to: Joi.string().email().max(255).allow(null, '').messages({
      'string.email': 'Reply-to must be a valid email'
    }),
    signature: Joi.string().allow(null, ''),
    smtp_config: Joi.object().allow(null),
    is_default: Joi.boolean().default(false),
    daily_limit: Joi.number().integer().min(1).default(500).messages({
      'number.min': 'Daily limit must be at least 1'
    })
  }),

  // Validación para actualizar un sender individual
  updateSender: Joi.object({
    name: Joi.string().min(2).max(255),
    email: Joi.string().email().max(255),
    reply_to: Joi.string().email().max(255).allow(null, ''),
    signature: Joi.string().allow(null, ''),
    smtp_config: Joi.object().allow(null),
    is_default: Joi.boolean(),
    daily_limit: Joi.number().integer().min(1)
  }).min(1),

  // Validación para crear múltiples senders
  bulkCreateSenders: Joi.object({
    senders: Joi.array().items(
      Joi.object({
        name: Joi.string().min(2).max(255).required(),
        email: Joi.string().email().max(255).required(),
        reply_to: Joi.string().email().max(255).allow(null, ''),
        signature: Joi.string().allow(null, ''),
        smtp_config: Joi.object().allow(null),
        is_default: Joi.boolean().default(false),
        daily_limit: Joi.number().integer().min(1).default(500)
      })
    ).min(1).max(100).required().messages({
      'array.min': 'At least one sender is required',
      'array.max': 'Maximum 100 senders allowed per request',
      'any.required': 'Senders array is required'
    })
  }),

  // Validación para actualizar múltiples senders
  bulkUpdateSenders: Joi.object({
    senders: Joi.array().items(
      Joi.object({
        id: Joi.number().integer().positive().required(),
        name: Joi.string().min(2).max(255),
        email: Joi.string().email().max(255),
        reply_to: Joi.string().email().max(255).allow(null, ''),
        signature: Joi.string().allow(null, ''),
        smtp_config: Joi.object().allow(null),
        is_default: Joi.boolean(),
        daily_limit: Joi.number().integer().min(1)
      })
    ).min(1).max(100).required().messages({
      'array.min': 'At least one sender is required',
      'array.max': 'Maximum 100 senders allowed per request',
      'any.required': 'Senders array is required'
    })
  }),

  // Validación para eliminar múltiples senders
  bulkDeleteSenders: Joi.object({
    ids: Joi.array().items(
      Joi.number().integer().positive()
    ).min(1).max(100).required().messages({
      'array.min': 'At least one ID is required',
      'array.max': 'Maximum 100 IDs allowed per request',
      'any.required': 'IDs array is required'
    })
  })
};

module.exports = senderValidators;
