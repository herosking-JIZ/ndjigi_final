// validators/chauffeur.validator.js
const Joi = require('joi');

const uuidSchema = Joi.string()
    .uuid({ version: ['uuidv4'] }).required()
    .messages({
        'any.required': 'L\'identifiant est obligatoire',
        'string.uuid':  'L\'identifiant doit être un UUID v4 valide'
    });

// req.params → GET /chauffeurs/:id
const chauffeurParamsSchema = Joi.object({
    id: uuidSchema.messages({
        'any.required': 'L\'ID du chauffeur est obligatoire',
        'string.uuid':  'L\'ID du chauffeur doit être un UUID v4 valide'
    })
});

// req.query → GET /chauffeurs?statut_disponibilite=disponible
const chauffeurQuerySchema = Joi.object({
    page:  Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),

    statut_validation: Joi.string()
        .valid('en_attente', 'valide', 'rejete', 'suspendu').optional()
        .messages({ 'any.only': 'Statut de validation invalide' }),

    statut_disponibilite: Joi.string()
        .valid('disponible', 'en_course', 'hors_ligne').optional()
        .messages({ 'any.only': 'Statut de disponibilité invalide' }),

    type_service: Joi.string()
        .valid('vtc', 'covoiturage', 'location').optional()
        .messages({ 'any.only': 'Type de service invalide' }),

    // Filtre les chauffeurs dont le permis expire bientôt
    permis_expire_avant: Joi.date().iso().optional()
        .messages({ 'date.format': 'La date doit être au format ISO 8601' })
});

// req.body → POST /chauffeurs
// Note : id_chauffeur = id_utilisateur (pas de gen_random_uuid, c'est une FK)
// → l'id vient du token JWT, pas du body
const createChauffeurSchema = Joi.object({

    // VarChar(20) obligatoire — pas de valeur par défaut métier exploitable
    type_service: Joi.string()
        .lowercase().trim()
        .valid('vtc', 'covoiturage', 'location')
        .required()
        .messages({
            'any.required': 'Le type de service est obligatoire',
            'any.only':     'Le type de service doit être : vtc, covoiturage ou location'
        }),

    // VarChar(30)? → optionnel à la création, soumis avec les documents
    numero_permis: Joi.string().trim().max(30).optional().allow(null)
        .messages({ 'string.max': 'Le numéro de permis ne peut pas dépasser 30 caractères' }),

    // Date? → optionnel
    date_expiration_permis: Joi.date().iso().optional().allow(null)
        .messages({
            'date.base':   'La date d\'expiration du permis doit être une date valide',
            'date.format': 'La date d\'expiration doit être au format ISO 8601'
        })

    // statut_validation : géré par l'admin, jamais par le chauffeur lui-même
    // statut_disponibilite : default 'hors_ligne' en base
    // note_chauffeur, nb_courses_effectuees, solde_commission_du : gérés par le système
});

// req.body → PATCH /chauffeurs/:id
const updateChauffeurSchema = createChauffeurSchema
    .fork(['type_service', 'numero_permis', 'date_expiration_permis'],
        (schema) => schema.optional())
    .min(1)
    .messages({ 'object.min': 'Au moins un champ doit être fourni pour la mise à jour' });

// PATCH /chauffeurs/:id/disponibilite — route dédiée au changement de statut
const updateDisponibiliteSchema = Joi.object({
    statut_disponibilite: Joi.string()
        .valid('disponible', 'en_course', 'hors_ligne')
        .required()
        .messages({
            'any.required': 'Le statut de disponibilité est obligatoire',
            'any.only':     'Le statut doit être : disponible, en_course ou hors_ligne'
        })
});

module.exports = {
    uuidSchema, chauffeurParamsSchema, chauffeurQuerySchema,
    createChauffeurSchema, updateChauffeurSchema, updateDisponibiliteSchema
};