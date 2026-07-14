const joi = require('joi');

const createFaqSchema = joi.object({
  question: joi.string()
    .trim()
    .min(10)
    .max(255)
    .required()
    .messages({
      'any.required': 'La question est obligatoire',
      'string.min': 'La question doit comporter au moins 10 caractères',
      'string.max': 'La question ne peut pas dépasser 255 caractères',
    }),

  reponse: joi.string()
    .trim()
    .min(20)
    .required()
    .messages({
      'any.required': 'La réponse est obligatoire',
      'string.min': 'La réponse doit comporter au moins 20 caractères',
    }),

  categorie: joi.string()
    .trim()
    .max(50)
    .optional()
    .messages({
      'string.max': 'La catégorie ne peut pas dépasser 50 caractères',
    }),

  ordre: joi.number()
    .integer()
    .min(0)
    .max(10000)
    .optional()
    .messages({
      'number.base': 'L\'ordre doit être un nombre',
      'number.min': 'L\'ordre doit être >= 0',
      'number.max': 'L\'ordre doit être <= 10000',
    }),

  isActive: joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isActive doit être un booléen',
    }),
});

const updateFaqSchema = createFaqSchema.fork(
  ['question', 'reponse'],
  (schema) => schema.optional()
).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni pour la mise à jour',
});

const reorderFaqSchema = joi.object({
  faqs: joi.array()
    .items(
      joi.object({
        id_faq: joi.string()
          .uuid({ version: ['uuidv4'] })
          .required()
          .messages({
            'any.required': 'id_faq est obligatoire',
            'string.uuid': 'id_faq doit être un UUID v4 valide',
          }),
        ordre: joi.number()
          .integer()
          .min(0)
          .required()
          .messages({
            'any.required': 'ordre est obligatoire',
            'number.base': 'ordre doit être un nombre',
            'number.min': 'ordre doit être >= 0',
          }),
      })
    )
    .min(1)
    .required()
    .messages({
      'any.required': 'Le tableau faqs est obligatoire',
      'array.min': 'Au moins une FAQ doit être réordonnée',
    }),
});

const searchFaqSchema = joi.object({
  q: joi.string()
    .trim()
    .min(2)
    .max(255)
    .required()
    .messages({
      'any.required': 'Le paramètre q est obligatoire',
      'string.min': 'La recherche doit comporter au moins 2 caractères',
      'string.max': 'La recherche ne peut pas dépasser 255 caractères',
    }),

  page: joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'La page doit être un nombre',
      'number.min': 'La page doit être >= 1',
    }),

  limit: joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.base': 'La limite doit être un nombre',
      'number.min': 'La limite doit être >= 1',
      'number.max': 'La limite ne peut pas dépasser 100',
    }),
});

const listFaqSchema = joi.object({
  page: joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'La page doit être un nombre',
      'number.min': 'La page doit être >= 1',
    }),

  limit: joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.base': 'La limite doit être un nombre',
      'number.min': 'La limite doit être >= 1',
      'number.max': 'La limite ne peut pas dépasser 100',
    }),

  categorie: joi.string()
    .trim()
    .max(50)
    .optional()
    .messages({
      'string.max': 'La catégorie ne peut pas dépasser 50 caractères',
    }),

  isActive: joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isActive doit être un booléen',
    }),
});

module.exports = {
  createFaqSchema,
  updateFaqSchema,
  reorderFaqSchema,
  searchFaqSchema,
  listFaqSchema,
};
