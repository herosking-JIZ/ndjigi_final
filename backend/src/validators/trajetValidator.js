const Joi = require('joi');

// ─────────────────────────────────────────────
// UUID réutilisable
// ─────────────────────────────────────────────
const uuidSchema = Joi.string()
    .uuid({ version: ['uuidv4'] })
    .required()
    .messages({
        'any.required': 'L\'identifiant est obligatoire',
        'string.base':  'L\'identifiant doit être une chaîne de caractères',
        'string.uuid':  'L\'identifiant doit être un UUID v4 valide',
        'string.guid':  'L\'identifiant doit être un UUID v4 valide'
    });

// ─────────────────────────────────────────────
// Schéma réutilisable : coordonnées GPS (Json en base)
// Utilisé pour coordonnees_depart et coordonnees_arrivee
// ─────────────────────────────────────────────
const coordonneesSchema = Joi.object({
    latitude: Joi.number()
        .min(-90).max(90)
        .required()
        .messages({
            'any.required': 'La latitude est obligatoire',
            'number.min':   'La latitude doit être comprise entre -90 et 90',
            'number.max':   'La latitude doit être comprise entre -90 et 90'
        }),
    longitude: Joi.number()
        .min(-180).max(180)
        .required()
        .messages({
            'any.required': 'La longitude est obligatoire',
            'number.min':   'La longitude doit être comprise entre -180 et 180',
            'number.max':   'La longitude doit être comprise entre -180 et 180'
        })
});

// ─────────────────────────────────────────────
// req.params → GET /trajets/:id
// ─────────────────────────────────────────────
const trajetParamsSchema = Joi.object({
    id: uuidSchema.messages({
        'any.required': 'L\'ID du trajet est obligatoire',
        'string.uuid':  'L\'ID du trajet doit être un UUID v4 valide',
        'string.guid':  'L\'ID du trajet doit être un UUID v4 valide'
    })
});

// ─────────────────────────────────────────────
// req.query → GET /trajets?page=1&limit=20&statut=en_cours
// Les champs ici ne vont PAS en base — ce sont des instructions
// de lecture transformées en clauses WHERE par le controller
// ─────────────────────────────────────────────
const trajetQuerySchema = Joi.object({

    // --- Pagination ---
    page: Joi.number().integer().min(1).default(1)
        .messages({
            'number.base':    'La page doit être un nombre',
            'number.integer': 'La page doit être un entier',
            'number.min':     'La page doit être au moins 1'
        }),

    limit: Joi.number().integer().min(1).max(100).default(20)
        .messages({
            'number.base':    'La limite doit être un nombre',
            'number.integer': 'La limite doit être un entier',
            'number.min':     'La limite doit être au moins 1',
            'number.max':     'La limite ne peut pas dépasser 100'
        }),

    search: Joi.string().trim().max(120).optional().allow(''),

    // --- Filtres métier ---

    // Filtre par statut du trajet
    statut: Joi.string()
        .lowercase().trim()
        .valid('en_attente', 'chauffeur_trouve', 'confirme', 'en_cours', 'termine', 'annule')
        .optional()
        .messages({
            'any.only': 'Statut de trajet invalide'
        }),

    // Filtre par type de trajet
    type_trajet: Joi.string()
        .lowercase().trim()
        .valid('vtc', 'covoiturage', 'location')
        .optional()
        .messages({
            'any.only': 'Le type de trajet doit être : vtc, covoiturage ou location'
        }),

    // Plage de dates de début
    date_heure_debut_min: Joi.date().iso().optional()
        .messages({
            'date.base':   'La date de début minimale doit être une date valide',
            'date.format': 'La date de début minimale doit être au format ISO 8601'
        }),

    date_heure_debut_max: Joi.date().iso()
        .min(Joi.ref('date_heure_debut_min')) // cohérence min/max
        .optional()
        .messages({
            'date.base':   'La date de début maximale doit être une date valide',
            'date.min':    'La date maximale doit être postérieure à la date minimale'
        }),

    // Plage de distance
    distance_min: Joi.number().min(0).optional()
        .messages({
            'number.base': 'La distance minimale doit être un nombre',
            'number.min':  'La distance minimale doit être positive ou nulle'
        }),

    distance_max: Joi.number()
        .min(Joi.ref('distance_min'))
        .optional()
        .messages({
            'number.base': 'La distance maximale doit être un nombre',
            'number.min':  'La distance maximale doit être supérieure à la distance minimale'
        }),

    // Filtre par zone tarifaire
    id_zone: Joi.string().uuid({ version: ['uuidv4'] }).optional()
        .messages({
            'string.uuid': 'L\'ID de la zone doit être un UUID v4 valide'
        }),

    // Filtre par affectation (utile pour retrouver les trajets d'un chauffeur)
    id_affectation: Joi.string().uuid({ version: ['uuidv4'] }).optional()
        .messages({
            'string.uuid': 'L\'ID de l\'affectation doit être un UUID v4 valide'
        }),

    // Inclure les trajets annulés (masqués par défaut dans certains contextes)
    inclure_annules: Joi.boolean().default(false).optional()
});

// ─────────────────────────────────────────────
// req.body → POST /trajets
// Champs NOT NULL sans default = obligatoires
// Champs avec ? dans Prisma = optionnels
// ─────────────────────────────────────────────
const createTrajetSchema = Joi.object({

    // FK obligatoire → affectation_vehicule (lie chauffeur + véhicule)
    id_affectation: uuidSchema.messages({
        'any.required': 'L\'ID de l\'affectation est obligatoire',
        'string.uuid':  'L\'ID de l\'affectation doit être un UUID v4 valide',
        'string.guid':  'L\'ID de l\'affectation doit être un UUID v4 valide'
    }),

    // FK optionnelle → zone_tarifaire (String? dans Prisma)
    id_zone: Joi.string()
        .uuid({ version: ['uuidv4'] })
        .optional()
        .allow(null)
        .messages({
            'string.uuid': 'L\'ID de la zone doit être un UUID v4 valide',
            'string.guid': 'L\'ID de la zone doit être un UUID v4 valide'
        }),

    // Adresse départ optionnelle (String? dans Prisma)
    adresse_depart: Joi.string().trim().max(255).optional().allow(null)
        .messages({
            'string.max': 'L\'adresse de départ ne peut pas dépasser 255 caractères'
        }),

    // Adresse arrivée obligatoire (String sans ? dans Prisma)
    adresse_arrivee: Joi.string().trim().max(255).required()
        .messages({
            'any.required': 'L\'adresse d\'arrivée est obligatoire',
            'string.max':   'L\'adresse d\'arrivée ne peut pas dépasser 255 caractères'
        }),

    // Json obligatoire — objet {lat, lng}
    coordonnees_depart: coordonneesSchema.required()
        .messages({
            'any.required': 'Les coordonnées de départ sont obligatoires'
        }),

    // Json obligatoire
    coordonnees_arrivee: coordonneesSchema.required()
        .messages({
            'any.required': 'Les coordonnées d\'arrivée sont obligatoires'
        }),

    // Decimal(8,2)? → optionnel, calculé côté serveur après le trajet
    distance_km: Joi.number().positive().precision(2).optional().allow(null)
        .messages({
            'number.positive':  'La distance doit être un nombre positif',
            'number.precision': 'La distance doit avoir au maximum 2 décimales'
        }),

    // Int? → optionnel, estimé par l'API de cartographie
    duree_estimee_min: Joi.number().integer().min(1).optional().allow(null)
        .messages({
            'number.integer': 'La durée estimée doit être un entier',
            'number.min':     'La durée estimée doit être d\'au moins 1 minute'
        }),

    // Chaîne encodée Google Polyline — optionnelle
    polyline_trajet: Joi.string().optional().allow(null),

    // Timestamp(6)? → optionnel à la création, mis à jour en cours de route
    date_heure_debut: Joi.date().iso().optional().allow(null)
        .messages({
            'date.base':   'La date de début doit être une date valide',
            'date.format': 'La date de début doit être au format ISO 8601'
        }),

    date_heure_fin: Joi.date().iso()
        .min(Joi.ref('date_heure_debut')) // fin > début si les deux sont fournis
        .optional()
        .allow(null)
        .messages({
            'date.base': 'La date de fin doit être une date valide',
            'date.min':  'La date de fin doit être postérieure à la date de début'
        }),

    // VarChar(20) avec default 'en_attente' en base
    statut: Joi.string()
        .lowercase().trim()
        .valid('en_attente', 'chauffeur_trouve', 'confirme', 'en_cours', 'termine', 'annule')
        .default('en_attente')
        .messages({
            'any.only': 'Statut de trajet invalide'
        }),

    // VarChar(20) obligatoire — pas de default en base
    type_trajet: Joi.string()
        .lowercase().trim()
        .valid('vtc', 'covoiturage', 'location')
        .required()
        .messages({
            'any.required': 'Le type de trajet est obligatoire',
            'any.only':     'Le type de trajet doit être : vtc, covoiturage ou location'
        }),

    // Decimal(10,2)? → calculé en fin de trajet, pas à la création
    tarif_final: Joi.number().positive().precision(2).optional().allow(null)
        .messages({
            'number.positive':  'Le tarif final doit être un nombre positif',
            'number.precision': 'Le tarif final doit avoir au maximum 2 décimales'
        })
});

// ─────────────────────────────────────────────
// req.body → PATCH /trajets/:id
// Tous les champs optionnels, au moins un requis
// ─────────────────────────────────────────────
const updateTrajetSchema = createTrajetSchema
    .fork(
        [
            'id_affectation',
            'id_zone',
            'adresse_depart',
            'adresse_arrivee',
            'coordonnees_depart',
            'coordonnees_arrivee',
            'distance_km',
            'duree_estimee_min',
            'polyline_trajet',
            'date_heure_debut',
            'date_heure_fin',
            'statut',
            'type_trajet',
            'tarif_final'
        ],
        (schema) => schema.optional()
    )
    .min(1)
    .messages({
        'object.min': 'Au moins un champ doit être fourni pour la mise à jour'
    });

const demandeVtcSchema = Joi.object({
    adresse_depart: Joi.string().trim().min(2).max(255).required(),
    adresse_arrivee: Joi.string().trim().min(2).max(255).required(),
    coordonnees_depart: coordonneesSchema.required(),
    coordonnees_arrivee: coordonneesSchema.required(),
    id_categorie: uuidSchema,
    id_zone: Joi.string().uuid({ version: ['uuidv4'] }).optional().allow(null),
    distance_km: Joi.number().positive().precision(2).required(),
    duree_estimee_min: Joi.number().integer().min(1).required(),
});

const tarifVtcSchema = Joi.object({
    id_zone: Joi.string().uuid({ version: ['uuidv4'] }).optional().allow(null),
    id_categorie: uuidSchema,
    distance_km: Joi.number().positive().precision(2).required(),
    duree_min: Joi.number().integer().min(1).required(),
    coefficient: Joi.number().min(1).optional(),
    coordonnees_depart: coordonneesSchema.optional(),
});

const annulationTrajetSchema = Joi.object({
    motif: Joi.string().trim().min(3).max(500).required(),
});

const terminerTrajetSchema = Joi.object({
    // Le tarif fourni par un client n'est jamais une source de vérité.
    polyline_trajet: Joi.string().max(100000).optional().allow(null, ''),
});

const demarrerTrajetSchema = Joi.object({
    pin: Joi.string().pattern(/^\d{4}$/).required().messages({
        'string.pattern.base': 'Le PIN doit contenir exactement 4 chiffres',
        'any.required': 'Le PIN de démarrage est obligatoire',
    }),
});

const trajetActifQuerySchema = Joi.object({
    role: Joi.string().valid('passager', 'chauffeur').required().messages({
        'any.only': 'Le rôle doit être passager ou chauffeur',
        'any.required': 'Le rôle actif est obligatoire',
    }),
});

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────
module.exports = {
    uuidSchema,            // UUID réutilisable dans d'autres validators
    trajetParamsSchema,    // req.params  → :id
    trajetQuerySchema,     // req.query   → filtres + pagination
    createTrajetSchema,    // req.body    → POST
    updateTrajetSchema,    // req.body    → PATCH
    demandeVtcSchema,
    tarifVtcSchema,
    annulationTrajetSchema,
    terminerTrajetSchema,
    demarrerTrajetSchema,
    trajetActifQuerySchema,
};
