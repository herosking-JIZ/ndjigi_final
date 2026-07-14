const Joi = require('joi');
const { uuidSchema } = require('./zoneTarifaireValidator');

// Paramètre :id_zone dans /config/tarifs/:id_zone
const tarifZoneParamSchema = Joi.object({
    id_zone: uuidSchema.required().label('ID de la zone').messages({
        'any.required': 'L\'ID de la zone est requis',
        'string.empty': 'L\'ID de la zone ne peut pas être vide',
        'string.guid': 'L\'ID de la zone doit être un UUID valide',
    }),
});

// Corps pour upsert — clé composite [id_zone + id_categorie]
const upsertTarifSchema = Joi.object({
    id_zone: uuidSchema.required().label('ID de la zone').messages({
        'any.required': 'L\'ID de la zone est requis',
        'string.guid': 'L\'ID de la zone doit être un UUID valide',
    }),

    id_categorie: uuidSchema.required().label('ID de la catégorie').messages({
        'any.required': 'L\'ID de la catégorie est requis',
        'string.guid': 'L\'ID de la catégorie doit être un UUID valide',
    }),

    tarif_base: Joi.number().positive().precision(2).required().messages({
        'any.required': 'Le tarif de base est obligatoire',
        'number.base': 'Le tarif de base doit être un nombre',
        'number.positive': 'Le tarif de base doit être supérieur à 0',
        'number.precision': 'Le tarif de base doit avoir au maximum 2 décimales',
    }),

    tarif_km: Joi.number().positive().precision(2).required().messages({
        'any.required': 'Le tarif par km est obligatoire',
        'number.base': 'Le tarif par km doit être un nombre',
        'number.positive': 'Le tarif par km doit être supérieur à 0',
        'number.precision': 'Le tarif par km doit avoir au maximum 2 décimales',
    }),

    tarif_minute: Joi.number().positive().precision(2).required().messages({
        'any.required': 'Le tarif par minute est obligatoire',
        'number.base': 'Le tarif par minute doit être un nombre',
        'number.positive': 'Le tarif par minute doit être supérieur à 0',
        'number.precision': 'Le tarif par minute doit avoir au maximum 2 décimales',
    }),

    actif: Joi.boolean().default(true).messages({
        'boolean.base': 'Le champ actif doit être un booléen (true/false)',
    }),
});

module.exports = {
    tarifZoneParamSchema,
    upsertTarifSchema,
};