/**
 * VALIDATORS/DEMANDEEXTENSION.VALIDATOR.JS
 * Joi validation schemas for extension requests
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

// Create extension request schema: POST /demandes-extension
const createDemandeExtensionSchema = Joi.object({
  extension_type: Joi.string()
    .valid('chauffeur', 'proprietaire')
    .required()
    .messages({
      'any.required': 'Le type d\'extension est obligatoire',
      'any.only': 'Le type d\'extension doit être "chauffeur" ou "proprietaire"'
    })
});

// Update statut schema: PATCH /demandes-extension/:id/statut
const updateStatutSchema = Joi.object({
  statut: Joi.string()
    .valid('accepte', 'refuse')
    .required()
    .messages({
      'any.required': 'Le statut est obligatoire',
      'any.only': 'Le statut doit être "accepte" ou "refuse"'
    }),

  motif_rejet: Joi.string()
    .trim()
    .min(5)
    .max(500)
    .when('statut', {
      is: 'refuse',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'any.required': 'Le motif de rejet est obligatoire pour un refus',
      'string.min': 'Le motif de rejet doit faire min 5 caractères',
      'string.max': 'Le motif de rejet doit faire max 500 caractères'
    })
});

// Query filters for listing: GET /demandes-extension/admin
const listDemandesQuerySchema = Joi.object({
  statut: Joi.string()
    .valid('en_attente', 'accepte', 'refuse')
    .optional()
    .messages({
      'any.only': 'Le statut doit être "en_attente", "accepte" ou "refuse"'
    }),

  extension_type: Joi.string()
    .valid('chauffeur', 'proprietaire')
    .optional()
    .messages({
      'any.only': 'Le type d\'extension doit être "chauffeur" ou "proprietaire"'
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

// Params schema for ID
const demandeParamsSchema = Joi.object({
  id: uuidSchema.messages({
    'any.required': 'L\'ID de la demande est obligatoire',
    'string.uuid': 'L\'ID doit être un UUID v4 valide'
  })
});

module.exports = {
  createDemandeExtensionSchema,
  updateStatutSchema,
  listDemandesQuerySchema,
  demandeParamsSchema
};
