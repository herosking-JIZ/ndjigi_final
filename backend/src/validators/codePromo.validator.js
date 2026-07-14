// validators/codePromo.validator.js
const Joi = require('joi');

const uuidSchema = Joi.string()
    .uuid({ version: ['uuidv4'] }).required()
    .messages({
        'any.required': 'L\'identifiant est obligatoire',
        'string.uuid':  'L\'identifiant doit être un UUID v4 valide'
    });

const codePromoParamsSchema = Joi.object({
    id: uuidSchema.messages({
        'any.required': 'L\'ID du code promo est obligatoire',
        'string.uuid':  'L\'ID du code promo doit être un UUID v4 valide'
    })
});

const codePromoQuerySchema = Joi.object({
    page:   Joi.number().integer().min(1).default(1),
    limit:  Joi.number().integer().min(1).max(100).default(20),
    actif:  Joi.boolean().optional(),
    type_reduction: Joi.string().valid('fixe', 'pourcentage').optional()
        .messages({ 'any.only': 'Le type doit être : fixe ou pourcentage' }),
    // Codes encore valides à une date donnée
    valide_le: Joi.date().iso().optional()
        .messages({ 'date.format': 'La date doit être au format ISO 8601' })
});

const createCodePromoSchema = Joi.object({

    // Unique en base, VarChar(30)
    code: Joi.string().trim().uppercase().min(3).max(30).required()
        .messages({
            'any.required':  'Le code promo est obligatoire',
            'string.empty':  'Le code promo est obligatoire',
            'string.min':    'Le code doit comporter au moins 3 caractères',
            'string.max':    'Le code ne peut pas dépasser 30 caractères'
        }),

    type_reduction: Joi.string()
        .valid('fixe', 'pourcentage')
        .required()
        .messages({
            'any.required': 'Le type de réduction est obligatoire',
            'any.only':     'Le type doit être : fixe ou pourcentage'
        }),

    // Règle métier : si pourcentage, valeur ≤ 100
    valeur: Joi.number().positive().precision(2).required()
        .when('type_reduction', {
            is:   'pourcentage',
            then: Joi.number().max(100).messages({
                'number.max': 'La valeur en pourcentage ne peut pas dépasser 100'
            })
        })
        .messages({
            'any.required':    'La valeur est obligatoire',
            'number.positive': 'La valeur doit être positive'
        }),

    date_debut: Joi.date().iso().required()
        .messages({
            'any.required': 'La date de début est obligatoire',
            'date.format':  'La date de début doit être au format ISO 8601'
        }),

    // DateTime? → optionnel (promo sans date de fin = permanente)
    date_fin: Joi.date().iso()
        .min(Joi.ref('date_debut'))
        .optional().allow(null)
        .messages({
            'date.min':    'La date de fin doit être postérieure à la date de début',
            'date.format': 'La date de fin doit être au format ISO 8601'
        }),

    // Int? → optionnel (null = utilisations illimitées)
    nb_utilisations_max: Joi.number().integer().min(1).optional().allow(null)
        .messages({ 'number.min': 'Le nombre maximum d\'utilisations doit être au moins 1' }),

    // Boolean default true en base
    actif: Joi.boolean().default(true)

    // nb_utilisations_actuel : géré par le système uniquement ({ increment: 1 })
});

const updateCodePromoSchema = createCodePromoSchema
    .fork(['code', 'type_reduction', 'valeur', 'date_debut', 'date_fin',
           'nb_utilisations_max', 'actif'],
        (schema) => schema.optional())
    .min(1)
    .messages({ 'object.min': 'Au moins un champ doit être fourni pour la mise à jour' });

module.exports = {
    uuidSchema, codePromoParamsSchema, codePromoQuerySchema,
    createCodePromoSchema, updateCodePromoSchema
};