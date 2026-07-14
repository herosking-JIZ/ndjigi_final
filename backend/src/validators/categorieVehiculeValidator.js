const Joi = require('joi');
const { uuidSchema } = require('./zoneTarifaireValidator');

const categorieIdParamSchema = Joi.object({
    id: uuidSchema.required().label('ID de la catégorie').messages({
        'any.required': 'L\'ID de la catégorie est requis',
        'string.empty': 'L\'ID de la catégorie ne peut pas être vide',
        'string.guid': 'L\'ID de la catégorie doit être un UUID valide',
    }),
});

const categorieQuerySchema = Joi.object({
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

const createCategorieSchema = Joi.object({
    nom: Joi.string().min(2).max(60).required().messages({
        'any.required': 'Le nom de la catégorie est obligatoire',
        'string.empty': 'Le nom de la catégorie ne peut pas être vide',
        'string.min': 'Le nom doit comporter au moins 2 caractères',
        'string.max': 'Le nom ne peut pas dépasser 60 caractères',
    }),

    description: Joi.string().max(255).optional().allow('', null).messages({
        'string.max': 'La description ne peut pas dépasser 255 caractères',
    }),

    actif: Joi.boolean().default(true).messages({
        'boolean.base': 'Le champ actif doit être un booléen (true/false)',
    }),
});

const updateCategorieSchema = createCategorieSchema
    .fork(['nom', 'description', 'actif'], (field) => field.optional())
    .min(1)
    .messages({
        'object.min': 'Au moins un champ doit être fourni pour la mise à jour',
    });

module.exports = {
    categorieIdParamSchema,
    categorieQuerySchema,
    createCategorieSchema,
    updateCategorieSchema,
};