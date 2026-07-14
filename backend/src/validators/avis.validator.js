// validators/avis.validator.js
const Joi = require('joi');

const uuidSchema = Joi.string()
    .uuid({ version: ['uuidv4'] })
    .required()
    .messages({
        'any.required': 'L\'identifiant est obligatoire',
        'string.base':  'L\'identifiant doit être une chaîne de caractères',
        'string.uuid':  'L\'identifiant doit être un UUID v4 valide',
        'string.guid':  'L\'identifiant doit être un UUID v4 valide'
    });

// req.params → GET /avis/:id
const avisParamsSchema = Joi.object({
    id: uuidSchema.messages({
        'any.required': 'L\'ID de l\'avis est obligatoire',
        'string.uuid':  'L\'ID de l\'avis doit être un UUID v4 valide'
    })
});

// req.query → GET /avis?note_min=3&id_evalue=...
const avisQuerySchema = Joi.object({
    page:  Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),

    // Filtrer les avis reçus par un utilisateur
    id_evalue: Joi.string().uuid({ version: ['uuidv4'] }).optional()
        .messages({ 'string.uuid': 'L\'ID de l\'évalué doit être un UUID v4 valide' }),

    // Filtrer les avis émis par un utilisateur
    id_evaluateur: Joi.string().uuid({ version: ['uuidv4'] }).optional()
        .messages({ 'string.uuid': 'L\'ID de l\'évaluateur doit être un UUID v4 valide' }),

    // Filtrer par trajet
    id_trajet: Joi.string().uuid({ version: ['uuidv4'] }).optional()
        .messages({ 'string.uuid': 'L\'ID du trajet doit être un UUID v4 valide' }),

    // Plage de notes
    note_min: Joi.number().integer().min(1).max(5).optional()
        .messages({ 'number.min': 'La note minimale est 1', 'number.max': 'La note maximale est 5' }),

    note_max: Joi.number().integer().min(Joi.ref('note_min')).max(5).optional()
        .messages({ 'number.min': 'La note max doit être >= note_min', 'number.max': 'La note maximale est 5' })
});

// req.body → POST /avis
const createAvisSchema = Joi.object({

    // Les deux acteurs sont obligatoires
    id_evaluateur: uuidSchema.messages({
        'any.required': 'L\'ID de l\'évaluateur est obligatoire',
        'string.uuid':  'L\'ID de l\'évaluateur doit être un UUID v4 valide'
    }),

    id_evalue: uuidSchema.messages({
        'any.required': 'L\'ID de l\'évalué est obligatoire',
        'string.uuid':  'L\'ID de l\'évalué doit être un UUID v4 valide'
    }),

    // String? → optionnel (un avis peut exister sans trajet lié)
    id_trajet: Joi.string().uuid({ version: ['uuidv4'] }).optional().allow(null)
        .messages({ 'string.uuid': 'L\'ID du trajet doit être un UUID v4 valide' }),

    // Int? SmallInt → 1 à 5, optionnel en base mais obligatoire métier
    note: Joi.number().integer().min(1).max(5).required()
        .messages({
            'any.required': 'La note est obligatoire',
            'number.min':   'La note doit être au moins 1',
            'number.max':   'La note ne peut pas dépasser 5'
        }),

    // String? → commentaire libre, optionnel
    commentaire: Joi.string().trim().max(1000).optional().allow(null)
        .messages({ 'string.max': 'Le commentaire ne peut pas dépasser 1000 caractères' })

    // date_avis : default(now()) en base → jamais envoyé par le client
});

// req.body → PATCH /avis/:id (seul note et commentaire sont modifiables)
const updateAvisSchema = createAvisSchema
    .fork(['id_evaluateur', 'id_evalue', 'id_trajet', 'note', 'commentaire'],
        (schema) => schema.optional())
    .min(1)
    .messages({ 'object.min': 'Au moins un champ doit être fourni pour la mise à jour' });

module.exports = { uuidSchema, avisParamsSchema, avisQuerySchema, createAvisSchema, updateAvisSchema };