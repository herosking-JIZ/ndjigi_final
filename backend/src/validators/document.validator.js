// validators/document.validator.js
const Joi = require('joi');

const uuidSchema = Joi.string()
    .uuid({ version: ['uuidv4'] }).required()
    .messages({
        'any.required': 'L\'identifiant est obligatoire',
        'string.uuid':  'L\'identifiant doit être un UUID v4 valide'
    });

const documentParamsSchema = Joi.object({
    id: uuidSchema.messages({
        'any.required': 'L\'ID du document est obligatoire',
        'string.uuid':  'L\'ID du document doit être un UUID v4 valide'
    })
});

const documentQuerySchema = Joi.object({
    page:  Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),

    id_utilisateur: Joi.string().uuid({ version: ['uuidv4'] }).optional()
        .messages({ 'string.uuid': 'L\'ID utilisateur doit être un UUID v4 valide' }),

    type: Joi.string()
        .valid('permis', 'carte_identite', 'assurance', 'carte_grise', 'autre')
        .optional()
        .messages({ 'any.only': 'Type de document invalide' }),

    statut_verification: Joi.string()
        .valid('en_attente', 'valide', 'rejete').optional()
        .messages({ 'any.only': 'Statut de vérification invalide' }),

    // Documents qui expirent bientôt
    expire_avant: Joi.date().iso().optional()
});

// req.body → POST /documents
// Note : url_fichier vient du service de stockage après upload (S3, etc.)
// L'utilisateur n'envoie pas l'URL directement — elle est générée côté serveur
// Ce validator couvre le body après traitement du fichier
const createDocumentSchema = Joi.object({

    // VarChar(40) obligatoire
    type: Joi.string().trim()
        .valid('permis', 'carte_identite', 'assurance', 'carte_grise', 'autre')
        .required()
        .messages({
            'any.required': 'Le type de document est obligatoire',
            'any.only':     'Le type doit être : permis, carte_identite, assurance, carte_grise ou autre'
        }),

    // URL générée par le service de stockage
    url_fichier: Joi.string()
        .uri({ scheme: ['http', 'https'] })
        .required()
        .messages({
            'any.required': 'L\'URL du fichier est obligatoire',
            'string.uri':   'L\'URL du fichier doit être une URL http/https valide'
        }),

    // Date? → optionnel (certains documents n'expirent pas)
    date_expiration: Joi.date().iso().min('now').optional().allow(null)
        .messages({
            'date.min':    'La date d\'expiration doit être dans le futur',
            'date.format': 'La date d\'expiration doit être au format ISO 8601'
        })

    // statut_verification : default 'en_attente', géré par admin uniquement
    // date_soumission : default(now()) en base
});

// PATCH /documents/:id/statut — route admin uniquement
const updateStatutDocumentSchema = Joi.object({
    statut_verification: Joi.string()
        .valid('en_attente', 'valide', 'rejete')
        .required()
        .messages({
            'any.required': 'Le statut est obligatoire',
            'any.only':     'Le statut doit être : en_attente, valide ou rejete'
        })
});

module.exports = {
    uuidSchema, documentParamsSchema, documentQuerySchema,
    createDocumentSchema, updateStatutDocumentSchema
};