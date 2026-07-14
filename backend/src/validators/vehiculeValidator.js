const joi = require('joi');

// ─────────────────────────────────────────────
// SCHÉMA RÉUTILISABLE : UUID générique
// Utilisé pour valider tout identifiant UUID
// venant de l'extérieur (params, body, query)
// ─────────────────────────────────────────────
const uuidSchema = joi.string()
    .uuid({ version: ['uuidv4'] })
    .required()
    .messages({
        'any.required': 'L\'identifiant est obligatoire',
        'string.base':  'L\'identifiant doit être une chaîne de caractères',
        'string.uuid':  'L\'identifiant doit être un UUID v4 valide',
        'string.guid':  'L\'identifiant doit être un UUID v4 valide'
    });

// ─────────────────────────────────────────────
// SCHÉMA : Paramètre de route  →  GET /vehicules/:id
// Valide uniquement l'id_vehicule reçu dans req.params
// ─────────────────────────────────────────────
const vehiculeParamsSchema = joi.object({
    id: uuidSchema
        .messages({
            'any.required': 'L\'ID du véhicule est obligatoire',
            'string.uuid':  'L\'ID du véhicule doit être un UUID v4 valide',
            'string.guid':  'L\'ID du véhicule doit être un UUID v4 valide'
        })
});

// ─────────────────────────────────────────────
// SCHÉMA : Query string  →  GET /vehicules?page=1&limit=20&statut=disponible
// Valide les filtres et la pagination dans req.query
// Tous les champs sont optionnels (lecture seule, filtre)
// ─────────────────────────────────────────────
const vehiculeQuerySchema = joi.object({

    // --- Pagination ---
    page: joi.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
            'number.base':    'La page doit être un nombre',
            'number.integer': 'La page doit être un entier',
            'number.min':     'La page doit être supérieure ou égale à 1'
        }),

    limit: joi.number()
        .integer()
        .min(1)
        .max(100)       // protège contre les requêtes trop lourdes
        .default(20)
        .messages({
            'number.base':    'La limite doit être un nombre',
            'number.integer': 'La limite doit être un entier',
            'number.min':     'La limite doit être supérieure ou égale à 1',
            'number.max':     'La limite ne peut pas dépasser 100 résultats'
        }),

    // --- Filtres métier ---
    statut: joi.string()
        .lowercase()
        .trim()
        .valid('disponible', 'en_course', 'en_location', 'maintenance', 'retire')
        .optional()
        .messages({
            'any.only': 'Le statut doit être : disponible, en_course, en_location, maintenance ou retire'
        }),

    id_categorie: uuidSchema
        .optional()
        .messages({
            'string.uuid': 'L\'ID de catégorie doit être un UUID v4 valide',
            'string.guid': 'L\'ID de catégorie doit être un UUID v4 valide'
        }),

    // Filtre par propriétaire (utile pour lister ses propres véhicules)
    id_proprietaire: uuidSchema
        .optional()
        .messages({
            'string.uuid': 'L\'ID du propriétaire doit être un UUID v4 valide',
            'string.guid': 'L\'ID du propriétaire doit être un UUID v4 valide'
        }),

    // Filtre par année (ex. ?annee_min=2015&annee_max=2023)
    annee_min: joi.number()
        .integer()
        .min(1900)
        .max(new Date().getFullYear())
        .optional()
        .messages({
            'number.min': 'L\'année minimale doit être supérieure à 1900',
            'number.max': `L'année minimale ne peut pas dépasser ${new Date().getFullYear()}`
        }),

    annee_max: joi.number()
        .integer()
        .min(1900)
        .max(new Date().getFullYear())
        .optional()
        .messages({
            'number.min': 'L\'année maximale doit être supérieure à 1900',
            'number.max': `L'année maximale ne peut pas dépasser ${new Date().getFullYear()}`
        }),

    // Inclure les véhicules supprimés (soft delete) — admin seulement
    inclure_supprimes: joi.boolean()
        .default(false)
        .optional()
});

// ─────────────────────────────────────────────
// SCHÉMA : Création d'un véhicule  →  POST /vehicules
// Tous les champs obligatoires sont marqués .required()
// Correspond exactement aux colonnes NOT NULL du modèle Prisma
// id_proprietaire n'est PAS accepté depuis le body : il est dérivé
// de req.user (JWT) par le contrôleur, jamais fait confiance au client.
// ─────────────────────────────────────────────
const createVehiculeSchema = joi.object({

    // Unique en base → VarChar(20)
    immatriculation: joi.string()
        .trim()
        .min(3)
        .max(20)
        .required()
        .messages({
            'any.required': 'L\'immatriculation est obligatoire',
            'string.min':   'L\'immatriculation doit comporter au moins 3 caractères',
            'string.max':   'L\'immatriculation ne peut pas dépasser 20 caractères'
        }),

    // VarChar(60) en base
    marque: joi.string()
        .trim()
        .min(2)
        .max(60)
        .required()
        .messages({
            'any.required': 'La marque est obligatoire',
            'string.min':   'La marque doit comporter au moins 2 caractères',
            'string.max':   'La marque ne peut pas dépasser 60 caractères'
        }),

    // VarChar(60) en base
    modele: joi.string()
        .trim()
        .min(1)
        .max(60)
        .required()
        .messages({
            'any.required': 'Le modèle est obligatoire',
            'string.min':   'Le modèle doit comporter au moins 1 caractère',
            'string.max':   'Le modèle ne peut pas dépasser 60 caractères'
        }),

    // SmallInt en base → max 32767, borne haute = année courante
    annee: joi.number()
        .integer()
        .min(1900)
        .max(new Date().getFullYear() + 1) // +1 pour les véhicules neufs de l'année suivante
        .required()
        .messages({
            'any.required': 'L\'année est obligatoire',
            'number.base':  'L\'année doit être un nombre',
            'number.min':   'L\'année doit être supérieure à 1900',
            'number.max':   `L'année ne peut pas dépasser ${new Date().getFullYear() + 1}`
        }),

    // FK vers la table categorie_vehicule
    id_categorie: uuidSchema
        .messages({
            'any.required': 'La catégorie est obligatoire',
            'string.uuid':  'L\'ID de catégorie doit être un UUID v4 valide',
            'string.guid':  'L\'ID de catégorie doit être un UUID v4 valide'
        }),

    // SmallInt en base
    nb_places: joi.number()
        .integer()
        .min(1)
        .max(50) // bus/minibus inclus
        .required()
        .messages({
            'any.required': 'Le nombre de places est obligatoire',
            'number.min':   'Le nombre de places doit être au moins 1',
            'number.max':   'Le nombre de places ne peut pas dépasser 50'
        }),

    // VarChar(30)? → optionnel en base mais requis à la création
    couleur: joi.string()
        .trim()
        .min(3)
        .max(30)
        .required()
        .messages({
            'any.required': 'La couleur est obligatoire',
            'string.min':   'La couleur doit comporter au moins 3 caractères',
            'string.max':   'La couleur ne peut pas dépasser 30 caractères'
        }),

    // Boolean avec default false en base
    climatisation: joi.boolean()
        .required()
        .messages({
            'any.required': 'Le champ climatisation est obligatoire',
            'boolean.base': 'Le champ climatisation doit être un booléen (true/false)'
        }),

    // Coordonnées GPS — Decimal(10,7) → précision ~1 cm
    latitude_actuelle: joi.number()
        .precision(7)
        .min(-90)
        .max(90)
        .optional()
        .allow(null)
        .messages({
            'number.min': 'La latitude doit être comprise entre -90 et 90',
            'number.max': 'La latitude doit être comprise entre -90 et 90'
        }),

    longitude_actuelle: joi.number()
        .precision(7)
        .min(-180)
        .max(180)
        .optional()
        .allow(null)
        .messages({
            'number.min': 'La longitude doit être comprise entre -180 et 180',
            'number.max': 'La longitude doit être comprise entre -180 et 180'
        }),

    // VarChar(20) avec default 'disponible' en base
    statut: joi.string()
        .lowercase()
        .trim()
        .valid('disponible', 'en_course', 'en_location', 'maintenance', 'retire')
        .default('disponible')
        .messages({
            'any.only': 'Le statut doit être : disponible, en_course, en_location, maintenance ou retire'
        }),

    // Boolean avec default false en base
    gps_actif: joi.boolean()
        .default(false)
        .messages({
            'boolean.base': 'Le champ gps_actif doit être un booléen (true/false)'
        }),

    // Discriminateur : détermine le sous-type créé (vehicule_course | vehicule_location)
    type: joi.string()
        .valid('course', 'location')
        .required()
        .messages({
            'any.required': 'Le type de véhicule est obligatoire (course ou location)',
            'any.only':     'Le type doit être "course" ou "location"'
        }),

    // VarChar(20) sur vehicule_course — requis uniquement si type = course
    type_service: joi.string()
        .trim()
        .max(20)
        .when('type', {
            is: 'course',
            then: joi.required(),
            otherwise: joi.forbidden()
        })
        .messages({
            'any.required':  'type_service est obligatoire pour un véhicule de course',
            'any.unknown':   'type_service ne s\'applique qu\'à un véhicule de course',
            'string.max':    'type_service ne peut pas dépasser 20 caractères'
        }),

    // Decimal(10,2) sur vehicule_location — autorisés uniquement si type = location
    tarif_base_location: joi.number()
        .positive()
        .precision(2)
        .when('type', {
            is: 'location',
            then: joi.optional(),
            otherwise: joi.forbidden()
        })
        .messages({
            'any.unknown':  'tarif_base_location ne s\'applique qu\'à un véhicule de location',
            'number.positive': 'tarif_base_location doit être positif'
        }),

    tarif_par_jour_location: joi.number()
        .positive()
        .precision(2)
        .when('type', {
            is: 'location',
            then: joi.optional(),
            otherwise: joi.forbidden()
        })
        .messages({
            'any.unknown':  'tarif_par_jour_location ne s\'applique qu\'à un véhicule de location',
            'number.positive': 'tarif_par_jour_location doit être positif'
        })
});

// ─────────────────────────────────────────────
// SCHÉMA : Mise à jour d'un véhicule  →  PATCH /vehicules/:id
// Tous les champs deviennent optionnels via .fork()
// Au moins un champ doit être fourni (règle .min(1))
// ─────────────────────────────────────────────
const updateVehiculeSchema = createVehiculeSchema
    .fork(
        [
            'immatriculation',
            'marque',
            'modele',
            'annee',
            'id_categorie',
            'nb_places',
            'couleur',
            'climatisation',
            'latitude_actuelle',
            'longitude_actuelle',
            'statut',
            'gps_actif'
        ],
        (schema) => schema.optional()
    )
    // Le sous-type (course/location) ne change pas après création
    .fork(['type'], () => joi.any().forbidden())
    // Champs de sous-type modifiables indépendamment de `type` (absent du body de mise à jour)
    .fork(
        ['type_service'],
        () => joi.string().trim().max(20).optional()
    )
    .fork(
        ['tarif_base_location', 'tarif_par_jour_location'],
        () => joi.number().positive().precision(2).optional()
    )
    .min(1) // interdit un body vide {}
    .messages({
        'object.min': 'Au moins un champ doit être fourni pour la mise à jour'
    });

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────
module.exports = {
    uuidSchema,              // UUID générique réutilisable
    vehiculeParamsSchema,    // req.params  → :id
    vehiculeQuerySchema,     // req.query   → filtres + pagination
    createVehiculeSchema,    // req.body    → POST
    updateVehiculeSchema     // req.body    → PATCH
};