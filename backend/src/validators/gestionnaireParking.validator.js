// validators/gestionnaireParking.validator.js
const Joi = require('joi');

const uuidSchema = Joi.string()
    .uuid({ version: ['uuidv4'] }).required()
    .messages({
        'any.required': 'L\'identifiant est obligatoire',
        'string.uuid':  'L\'identifiant doit être un UUID v4 valide'
    });

// req.params → GET /gestionnaires/:id
const gestionnaireParamsSchema = Joi.object({
    id: uuidSchema.messages({
        'any.required': 'L\'ID du gestionnaire est obligatoire',
        'string.uuid':  'L\'ID du gestionnaire doit être un UUID v4 valide'
    })
});

const gestionnaireQuerySchema = Joi.object({
    page:  Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),

    // Lister les gestionnaires d'un parking précis
    id_parking: Joi.string().uuid({ version: ['uuidv4'] }).optional()
        .messages({ 'string.uuid': 'L\'ID du parking doit être un UUID v4 valide' })
});

// req.body → POST /gestionnaires
// Note : id_gestionnaire = id_utilisateur (FK, vient du token ou du body admin)
const createGestionnaireSchema = Joi.object({

    // FK vers utilisateur — fourni par l'admin
    id_gestionnaire: uuidSchema.messages({
        'any.required': 'L\'ID du gestionnaire est obligatoire',
        'string.uuid':  'L\'ID du gestionnaire doit être un UUID v4 valide'
    }),

    // FK vers parking — obligatoire (non nullable en base)
    id_parking: uuidSchema.messages({
        'any.required': 'L\'ID du parking est obligatoire',
        'string.uuid':  'L\'ID du parking doit être un UUID v4 valide'
    }),

    // Date? → optionnel
    date_prise_poste: Joi.date().iso().optional().allow(null)
        .messages({
            'date.base':   'La date de prise de poste doit être une date valide',
            'date.format': 'La date de prise de poste doit être au format ISO 8601'
        })
});

// PATCH → seule date_prise_poste et id_parking sont modifiables
const updateGestionnaireSchema = createGestionnaireSchema
    .fork(['id_gestionnaire', 'id_parking', 'date_prise_poste'],
        (schema) => schema.optional())
    .min(1)
    .messages({ 'object.min': 'Au moins un champ doit être fourni pour la mise à jour' });

module.exports = {
    uuidSchema, gestionnaireParamsSchema, gestionnaireQuerySchema,
    createGestionnaireSchema, updateGestionnaireSchema
};