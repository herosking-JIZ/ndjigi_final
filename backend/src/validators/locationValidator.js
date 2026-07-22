const joi = require('joi');

// ─────────────────────────────────────────────
// SCHÉMA : Rechercher des véhicules disponibles  →  GET /locations/vehicules
// ─────────────────────────────────────────────
const rechercherVehiculesQuerySchema = joi.object({
    id_categorie: joi.string()
        .uuid({ version: ['uuidv4'] })
        .optional()
        .messages({
            'string.uuid': 'id_categorie doit être un UUID v4 valide',
            'string.guid': 'id_categorie doit être un UUID v4 valide'
        }),

    date_debut: joi.date()
        .iso()
        .optional()
        .messages({ 'date.format': 'date_debut doit être une date ISO valide' }),

    date_fin: joi.date()
        .iso()
        .greater(joi.ref('date_debut'))
        .optional()
        .messages({
            'date.format':  'date_fin doit être une date ISO valide',
            'date.greater': 'date_fin doit être postérieure à date_debut'
        }),

    page: joi.number().integer().min(1).default(1)
        .messages({
            'number.base':    'La page doit être un nombre',
            'number.integer': 'La page doit être un entier',
            'number.min':     'La page doit être supérieure ou égale à 1'
        }),

    limit: joi.number().integer().min(1).max(100).default(20)
        .messages({
            'number.base':    'La limite doit être un nombre',
            'number.integer': 'La limite doit être un entier',
            'number.min':     'La limite doit être supérieure ou égale à 1',
            'number.max':     'La limite ne peut pas dépasser 100 résultats'
        }),
})
.with('date_fin', 'date_debut')
.messages({ 'object.with': 'date_debut est requis lorsque date_fin est fourni' });

// ─────────────────────────────────────────────
// SCHÉMA : Créer une demande de location  →  POST /locations
// ─────────────────────────────────────────────
const createLocationSchema = joi.object({
    id_vehicule: joi.string()
        .uuid({ version: ['uuidv4'] })
        .required()
        .messages({
            'any.required': 'id_vehicule est obligatoire',
            'string.uuid':  'id_vehicule doit être un UUID v4 valide',
            'string.guid':  'id_vehicule doit être un UUID v4 valide'
        }),

    date_debut: joi.date()
        .iso()
        .required()
        .messages({
            'any.required': 'date_debut est obligatoire',
            'date.format':  'date_debut doit être une date ISO valide'
        }),

    date_fin: joi.date()
        .iso()
        .greater(joi.ref('date_debut'))
        .required()
        .messages({
            'any.required':  'date_fin est obligatoire',
            'date.format':   'date_fin doit être une date ISO valide',
            'date.greater':  'date_fin doit être postérieure à date_debut'
        })
});

// ─────────────────────────────────────────────
// SCHÉMA : req.params → GET/PATCH /locations/:id...
// ─────────────────────────────────────────────
const locationParamsSchema = joi.object({
    id: joi.string()
        .uuid({ version: ['uuidv4'] })
        .required()
        .messages({
            'any.required': 'L\'ID de la location est obligatoire',
            'string.uuid':  'L\'ID de la location doit être un UUID v4 valide',
            'string.guid':  'L\'ID de la location doit être un UUID v4 valide'
        })
});

module.exports = { createLocationSchema, rechercherVehiculesQuerySchema, locationParamsSchema };
