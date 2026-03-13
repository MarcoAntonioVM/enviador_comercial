const Joi = require('joi');

const emailValidators = {
  sendTest: Joi.object({
    to: Joi.string().email().max(255).required().messages({
      'string.email': 'Please provide a valid recipient email',
      'any.required': 'Recipient email (to) is required'
    }),
    subject: Joi.string().min(1).max(500).required().messages({
      'any.required': 'Subject is required'
    }),
    html: Joi.string().allow('').optional(),
    text: Joi.string().allow('').optional(),
    sender_id: Joi.number().integer().positive().optional()
  }).or('html', 'text').messages({
    'object.missing': 'Either html or text content is required'
  })
  ,
  sendByPreconfiguration: Joi.object({
    preconfiguration_id: Joi.number().integer().positive().required().messages({
      'any.required': 'preconfiguration_id is required',
      'number.base': 'preconfiguration_id must be a number'
    })
  })
};

module.exports = emailValidators;
