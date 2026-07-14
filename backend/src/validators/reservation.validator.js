const Joi = require('joi');

const uuidSchema = Joi.string()
    .uuid({ version: ['uuidv4'] }).required()
    .messages({
        'any.required': 'L\'identifiant est obligatoire',
        'string.uuid':  'L\'identifiant doit être un UUID v4 valide'
    });

// req.params → GET /reservations/:id
const reservationParamsSchema = Joi.object({
    id: uuidSchema.messages({
        'any.required': 'L\'ID de la réservation est obligatoire',
        'string.uuid':  'L\'ID de la réservation doit être un UUID v4 valide'
    })
});

// req.query → GET /reservations?statut=en_attente&id_passager=...
const reservationQuerySchema = Joi.object({
    page:  Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),

    // ✅ statut une seule fois avec messages
    statut: Joi.string()
        .valid('en_attente', 'acceptee', 'refusee', 'annulee', 'terminee')
        .optional()
        .messages({ 'any.only': 'Statut invalide' }),

    id_passager: Joi.string().uuid({ version: ['uuidv4'] }).optional()
        .messages({ 'string.uuid': 'L\'ID du passager doit être un UUID v4 valide' }),

    id_trajet: Joi.string().uuid({ version: ['uuidv4'] }).optional()
        .messages({ 'string.uuid': 'L\'ID du trajet doit être un UUID v4 valide' }),

    // Plage de dates souhaitées
    date_min: Joi.date().iso().optional(),
    date_max: Joi.date().iso().min(Joi.ref('date_min')).optional()
        .messages({ 'date.min': 'La date max doit être postérieure à la date min' })
});

// req.body → POST /reservations
const createReservationSchema = Joi.object({

    // FK passager — peut venir du token JWT côté controller
    id_passager: uuidSchema.messages({
        'any.required': 'L\'ID du passager est obligatoire',
        'string.uuid':  'L\'ID du passager doit être un UUID v4 valide'
    }),

    // FK trajet
    id_trajet: uuidSchema.messages({
        'any.required': 'L\'ID du trajet est obligatoire',
        'string.uuid':  'L\'ID du trajet doit être un UUID v4 valide'
    }),

    // ✅ date_reservation supprimée — default(now()) géré par Prisma
    // ✅ statut supprimé — toujours 'en_attente' à la création
    // ✅ rappels supprimés — gérés par le système de notifications

    // Seul champ métier que le passager choisit vraiment
    date_trajet_souhaite: Joi.date().iso().min('now').required()
        .messages({
            'any.required': 'La date souhaitée du trajet est obligatoire',
            'date.min':     'La date souhaitée ne peut pas être dans le passé',
            'date.format':  'La date souhaitée doit être au format ISO 8601'
        })
});

// req.body → PATCH /reservations/:id
// Seuls le statut et la date sont modifiables par les acteurs autorisés
const updateReservationSchema = Joi.object({
    statut: Joi.string()
        .valid('en_attente', 'acceptee', 'refusee', 'annulee', 'terminee')
        .optional()
        .messages({ 'any.only': 'Statut invalide' }),

    date_trajet_souhaite: Joi.date().iso().optional()
        .messages({ 'date.format': 'La date souhaitée doit être au format ISO 8601' })
    // ✅ Pas de .fork() ici — on définit manuellement ce qui est modifiable
    // id_passager et id_trajet ne sont JAMAIS modifiables après création
})
.min(1)
.messages({ 'object.min': 'Au moins un champ doit être fourni pour la mise à jour' });

module.exports = {
    uuidSchema, reservationParamsSchema, reservationQuerySchema,
    createReservationSchema, updateReservationSchema
};
