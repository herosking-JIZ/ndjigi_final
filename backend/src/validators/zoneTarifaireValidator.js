const Joi = require('joi');

const uuidSchema = Joi.string()
  .uuid()
  .messages({
    'string.base': 'L\'ID doit être une chaîne de caractères',
    'string.empty': 'L\'ID ne peut pas être vide',
    'string.guid': 'L\'ID doit être un UUID valide (version 4)',
  });

const zoneIdParamSchema = Joi.object({
  id: uuidSchema.required().label('ID de la zone').messages({
    'any.required': 'L\'ID de la zone est requis',
    'string.empty': 'L\'ID de la zone ne peut pas être vide',
    'string.guid': 'L\'ID de la zone doit être un UUID valide',
  }),
});

const zoneQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'La page doit être un nombre',
    'number.min': 'La page doit être au moins 1',
  }),
  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.base': 'La limite doit être un nombre',
    'number.min': 'La limite doit être au moins 1',
    'number.max': 'La limite ne peut pas dépasser 100',
  }),
  nom: Joi.string().min(2).max(60).optional().messages({
    'string.min': 'Le nom doit comporter au moins 2 caractères',
    'string.max': 'Le nom ne peut pas dépasser 60 caractères',
  }),
  actif: Joi.boolean().optional(),
});

const createZoneSchema = Joi.object({
  nom: Joi.string().min(3).max(60).required().messages({
    'any.required': 'Le nom de la zone est obligatoire',
    'string.empty': 'Le nom de la zone ne peut pas être vide',
    'string.min': 'Le nom doit comporter au moins 3 caractères',
    'string.max': 'Le nom ne peut pas dépasser 60 caractères',
  }),

  vitesse_moyenne_kmh: Joi.number().integer().min(5).max(130).required().messages({
    'any.required': 'La vitesse moyenne est obligatoire',
    'number.base': 'La vitesse moyenne doit être un nombre',
    'number.integer': 'La vitesse moyenne doit être un entier',
    'number.min': 'La vitesse moyenne doit être au moins 5 km/h',
    'number.max': 'La vitesse moyenne ne peut pas dépasser 130 km/h',
  }),

  coefficient_max: Joi.number().min(1).max(5).precision(2).default(3.0).messages({
    'number.base': 'Le coefficient max doit être un nombre',
    'number.min': 'Le coefficient max doit être au moins 1',
    'number.max': 'Le coefficient max ne peut pas dépasser 5',
    'number.precision': 'Le coefficient max doit avoir au maximum 2 décimales',
  }),

  actif: Joi.boolean().default(true).messages({
    'boolean.base': 'Le champ actif doit être un booléen (true/false)',
  }),
});

const updateZoneSchema = createZoneSchema
  .fork(['nom', 'vitesse_moyenne_kmh', 'coefficient_max', 'actif'], (field) => field.optional())
  .min(1)
  .messages({
    'object.min': 'Au moins un champ doit être fourni pour la mise à jour',
  });

module.exports = {
  uuidSchema,
  zoneIdParamSchema,
  zoneQuerySchema,
  createZoneSchema,
  updateZoneSchema,
};