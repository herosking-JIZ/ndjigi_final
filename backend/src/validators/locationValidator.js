const joi = require('joi');

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

module.exports = { createLocationSchema };
