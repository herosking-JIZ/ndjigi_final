/**
 * VALIDATORS/ADDRESS.VALIDATOR.JS
 * Joi validation schemas for address management
 */

const Joi = require('joi');

// UUID schema (reusable)
const uuidSchema = Joi.string()
  .uuid({ version: ['uuidv4'] })
  .required()
  .messages({
    'any.required': 'L\'identifiant est obligatoire',
    'string.uuid': 'L\'identifiant doit être un UUID v4 valide'
  });

// Create address schema: POST /addresses
const createAddressSchema = Joi.object({
  label: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'any.required': 'Le label est obligatoire',
      'string.empty': 'Le label ne peut pas être vide',
      'string.max': 'Le label doit faire max 100 caractères'
    }),

  address: Joi.string()
    .trim()
    .min(5)
    .max(500)
    .required()
    .messages({
      'any.required': 'L\'adresse est obligatoire',
      'string.empty': 'L\'adresse ne peut pas être vide',
      'string.min': 'L\'adresse doit faire min 5 caractères',
      'string.max': 'L\'adresse doit faire max 500 caractères'
    }),

  latitude: Joi.number()
    .precision(7)
    .min(-90)
    .max(90)
    .required()
    .messages({
      'any.required': 'La latitude est obligatoire',
      'number.base': 'La latitude doit être un nombre',
      'number.min': 'La latitude doit être entre -90 et 90',
      'number.max': 'La latitude doit être entre -90 et 90'
    }),

  longitude: Joi.number()
    .precision(7)
    .min(-180)
    .max(180)
    .required()
    .messages({
      'any.required': 'La longitude est obligatoire',
      'number.base': 'La longitude doit être un nombre',
      'number.min': 'La longitude doit être entre -180 et 180',
      'number.max': 'La longitude doit être entre -180 et 180'
    }),

  isfavorite: Joi.boolean()
    .optional()
    .default(false)
    .messages({
      'boolean.base': 'isfavorite doit être true ou false'
    })
});

// Update address schema: PATCH /addresses/:id
const updateAddressSchema = Joi.object({
  label: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.empty': 'Le label ne peut pas être vide',
      'string.max': 'Le label doit faire max 100 caractères'
    }),

  address: Joi.string()
    .trim()
    .min(5)
    .max(500)
    .optional()
    .messages({
      'string.empty': 'L\'adresse ne peut pas être vide',
      'string.min': 'L\'adresse doit faire min 5 caractères',
      'string.max': 'L\'adresse doit faire max 500 caractères'
    }),

  latitude: Joi.number()
    .precision(7)
    .min(-90)
    .max(90)
    .optional()
    .messages({
      'number.base': 'La latitude doit être un nombre',
      'number.min': 'La latitude doit être entre -90 et 90',
      'number.max': 'La latitude doit être entre -90 et 90'
    }),

  longitude: Joi.number()
    .precision(7)
    .min(-180)
    .max(180)
    .optional()
    .messages({
      'number.base': 'La longitude doit être un nombre',
      'number.min': 'La longitude doit être entre -180 et 180',
      'number.max': 'La longitude doit être entre -180 et 180'
    }),

  isfavorite: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isfavorite doit être true ou false'
    })
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni'
});

// Query schema for listing
const listAddressQuerySchema = Joi.object({
  favorite: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'favorite doit être true ou false'
    }),

  label: Joi.string()
    .trim()
    .optional()
    .messages({
      'string.base': 'label doit être une chaîne'
    }),

  search: Joi.string()
    .trim()
    .max(500)
    .optional()
    .messages({
      'string.max': 'search doit faire max 500 caractères'
    }),

  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.min': 'page doit être >= 1'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(20)
    .messages({
      'number.min': 'limit doit être >= 1',
      'number.max': 'limit doit être <= 100'
    })
});

// Params schema
const addressParamsSchema = Joi.object({
  id: uuidSchema.messages({
    'any.required': 'L\'ID de l\'adresse est obligatoire',
    'string.uuid': 'L\'ID doit être un UUID v4 valide'
  })
});

module.exports = {
  createAddressSchema,
  updateAddressSchema,
  listAddressQuerySchema,
  addressParamsSchema,
  uuidSchema
};
