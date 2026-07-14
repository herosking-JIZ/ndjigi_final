/**
 * VALIDATORS/PHOTO.VALIDATOR.JS
 * Joi validation schemas for photo uploads and metadata
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

// Photo params schema
const photoParamsSchema = Joi.object({
  photoId: uuidSchema.messages({
    'any.required': 'L\'ID de la photo est obligatoire',
    'string.uuid': 'L\'ID de la photo doit être un UUID v4 valide'
  }),
  ownerType: Joi.string()
    .valid('vehicule', 'utilisateur', 'journal_parking')
    .required()
    .messages({
      'any.required': 'Le type de propriétaire est obligatoire',
      'any.only': 'Le type doit être : vehicule, utilisateur ou journal_parking'
    }),
  ownerId: uuidSchema.optional().messages({
    'string.uuid': 'L\'ID du propriétaire doit être un UUID v4 valide'
  })
});

// Query schema for gallery listing
const galleryQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({ 'number.min': 'Page doit être >= 1' }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.min': 'Limit doit être >= 1',
      'number.max': 'Limit doit être <= 100'
    })
});

// Upload schema: POST /photos
// Validates body (ownerType, ownerId, metadata)
// Files are handled by multer middleware
const photoUploadSchema = Joi.object({
  ownerType: Joi.string()
    .valid('vehicule', 'utilisateur', 'journal_parking')
    .required()
    .messages({
      'any.required': 'Le type de propriétaire est obligatoire',
      'any.only': 'Le type doit être : vehicule, utilisateur ou journal_parking'
    }),

  // ownerId is required for all except 'utilisateur' (owner = current user)
  ownerId: Joi.string()
    .uuid({ version: ['uuidv4'] })
    .when('ownerType', {
      is: 'utilisateur',
      then: Joi.optional().allow(null),
      otherwise: Joi.required(),
    })
    .messages({
      'string.uuid': 'L\'ID du propriétaire doit être un UUID v4 valide',
      'any.required': 'ownerId est obligatoire pour ownerType: vehicule, journal_parking',
    }),

  isPrincipale: Joi.boolean()
    .optional()
    .default(false)
    .messages({
      'boolean.base': 'isPrincipale doit être true ou false'
    }),

  ordre: Joi.number()
    .integer()
    .min(0)
    .max(1000)
    .optional()
    .default(0)
    .messages({
      'number.base': 'ordre doit être un nombre',
      'number.min': 'ordre doit être >= 0',
      'number.max': 'ordre doit être <= 1000'
    }),

  legende: Joi.string()
    .trim()
    .max(255)
    .optional()
    .allow(null)
    .messages({
      'string.max': 'legende doit faire max 255 caractères'
    })
});

// Update metadata schema: PATCH /photos/:photoId
// Validates metadata updates only
const photoMetadataSchema = Joi.object({
  legende: Joi.string()
    .trim()
    .max(255)
    .optional()
    .allow(null)
    .messages({
      'string.max': 'legende doit faire max 255 caractères'
    }),

  ordre: Joi.number()
    .integer()
    .min(0)
    .max(1000)
    .optional()
    .messages({
      'number.base': 'ordre doit être un nombre',
      'number.min': 'ordre doit être >= 0',
      'number.max': 'ordre doit être <= 1000'
    }),

  is_principale: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'is_principale doit être true ou false'
    })
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni (legende, ordre, is_principale)'
});

// Batch metadata update: PATCH /photos with array of updates
const photoBatchMetadataSchema = Joi.object({
  updates: Joi.array()
    .items(
      Joi.object({
        photoId: uuidSchema,
        legende: Joi.string().trim().max(255).optional().allow(null),
        ordre: Joi.number().integer().min(0).max(1000).optional(),
        is_principale: Joi.boolean().optional()
      }).min(1)
    )
    .required()
    .min(1)
    .max(50)
    .messages({
      'array.min': 'Au moins une photo doit être fournie',
      'array.max': 'Maximum 50 photos par batch'
    })
});

module.exports = {
  uuidSchema,
  photoParamsSchema,
  galleryQuerySchema,
  photoUploadSchema,
  photoMetadataSchema,
  photoBatchMetadataSchema
};
