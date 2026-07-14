/**
 * VALIDATORS/CONTACT.VALIDATOR.JS
 * Joi validation schemas for emergency contact management
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

// Valid relation types
const VALID_RELATIONS = ['parent', 'enfant', 'conjoint', 'frere', 'soeur', 'cousin', 'copain', 'copine', 'autre'];

// Valid country codes (examples - can be extended)
const VALID_COUNTRY_CODES = [
  '+1', '+7', '+20', '+27', '+30', '+31', '+32', '+33', '+34', '+36', '+39', '+40', '+41', '+43', '+44', '+45', '+46', '+47', '+48', '+49',
  '+51', '+52', '+53', '+54', '+55', '+56', '+57', '+58', '+60', '+61', '+62', '+63', '+64', '+65', '+66', '+81', '+82', '+84', '+86',
  '+90', '+91', '+92', '+93', '+94', '+95', '+98', '+212', '+213', '+216', '+218', '+220', '+221', '+222', '+223', '+224', '+225', '+226',
  '+227', '+228', '+229', '+230', '+231', '+232', '+233', '+234', '+235', '+236', '+237', '+238', '+239', '+240', '+241', '+242', '+243',
  '+244', '+245', '+246', '+248', '+249', '+250', '+251', '+252', '+253', '+254', '+255', '+256', '+257', '+258', '+260', '+261', '+262',
  '+263', '+264', '+265', '+266', '+267', '+268', '+269', '+290', '+291', '+297', '+298', '+299', '+350', '+351', '+352', '+353', '+354',
  '+355', '+356', '+357', '+358', '+359', '+370', '+371', '+372', '+373', '+374', '+375', '+376', '+377', '+378', '+380', '+381', '+382',
  '+383', '+385', '+386', '+387', '+389', '+420', '+421', '+423', '+500', '+501', '+502', '+503', '+504', '+505', '+506', '+507', '+508',
  '+509', '+590', '+591', '+592', '+593', '+594', '+595', '+596', '+597', '+598', '+599', '+670', '+672', '+673', '+674', '+675', '+676',
  '+677', '+678', '+679', '+680', '+681', '+682', '+683', '+684', '+685', '+686', '+687', '+688', '+689', '+690', '+691', '+692', '+850',
  '+852', '+853', '+855', '+856', '+880', '+886', '+960', '+961', '+962', '+963', '+964', '+965', '+966', '+967', '+968', '+970', '+971',
  '+972', '+973', '+974', '+975', '+976', '+977', '+992', '+993', '+994', '+995', '+996', '+998'
];

// Create contact schema: POST /contacts-confiance
const createContactSchema = Joi.object({
  nom: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'any.required': 'Le nom est obligatoire',
      'string.empty': 'Le nom ne peut pas être vide',
      'string.max': 'Le nom doit faire max 100 caractères'
    }),

  prenom: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'any.required': 'Le prénom est obligatoire',
      'string.empty': 'Le prénom ne peut pas être vide',
      'string.max': 'Le prénom doit faire max 100 caractères'
    }),

  country_code: Joi.string()
    .trim()
    .valid(...VALID_COUNTRY_CODES)
    .required()
    .messages({
      'any.required': 'Le code pays est obligatoire',
      'any.only': 'Code pays invalide (ex: +221, +33, +1)'
    }),

  phone: Joi.string()
    .trim()
    .pattern(/^[0-9\s\-()]+$/)
    .min(7)
    .max(20)
    .required()
    .messages({
      'any.required': 'Le numéro de téléphone est obligatoire',
      'string.pattern.base': 'Le numéro doit contenir uniquement des chiffres, espaces, tirets ou parenthèses',
      'string.min': 'Le numéro doit faire min 7 caractères',
      'string.max': 'Le numéro doit faire max 20 caractères'
    }),

  relation: Joi.string()
    .valid(...VALID_RELATIONS)
    .required()
    .messages({
      'any.required': 'La relation est obligatoire',
      'any.only': `Relation invalide. Valides: ${VALID_RELATIONS.join(', ')}`
    })
});

// Update contact schema: PATCH /contacts-confiance/:id
const updateContactSchema = Joi.object({
  nom: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.empty': 'Le nom ne peut pas être vide',
      'string.max': 'Le nom doit faire max 100 caractères'
    }),

  prenom: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.empty': 'Le prénom ne peut pas être vide',
      'string.max': 'Le prénom doit faire max 100 caractères'
    }),

  country_code: Joi.string()
    .trim()
    .valid(...VALID_COUNTRY_CODES)
    .optional()
    .messages({
      'any.only': 'Code pays invalide'
    }),

  phone: Joi.string()
    .trim()
    .pattern(/^[0-9\s\-()]+$/)
    .min(7)
    .max(20)
    .optional()
    .messages({
      'string.pattern.base': 'Le numéro doit contenir uniquement des chiffres, espaces, tirets ou parenthèses',
      'string.min': 'Le numéro doit faire min 7 caractères',
      'string.max': 'Le numéro doit faire max 20 caractères'
    }),

  relation: Joi.string()
    .valid(...VALID_RELATIONS)
    .optional()
    .messages({
      'any.only': `Relation invalide. Valides: ${VALID_RELATIONS.join(', ')}`
    })
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni'
});

// Query schema for listing
const listContactQuerySchema = Joi.object({
  relation: Joi.string()
    .valid(...VALID_RELATIONS)
    .optional()
    .messages({
      'any.only': `Relation invalide`
    }),

  search: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.max': 'search doit faire max 100 caractères'
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
const contactParamsSchema = Joi.object({
  id: uuidSchema.messages({
    'any.required': 'L\'ID du contact est obligatoire',
    'string.uuid': 'L\'ID doit être un UUID v4 valide'
  })
});

module.exports = {
  createContactSchema,
  updateContactSchema,
  listContactQuerySchema,
  contactParamsSchema,
  uuidSchema,
  VALID_RELATIONS,
  VALID_COUNTRY_CODES
};
