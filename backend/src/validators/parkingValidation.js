const Joi = require('joi')

const parkingSchema = Joi.object({
  nom:         Joi.string().min(3).max(50).required(),
  adresse:     Joi.string().min(5).max(100).required(),
  capacite_totale:    Joi.number().integer().min(1).required(),
  capacite_occupee:   Joi.number().integer().min(0).optional(),
  latitude:    Joi.number().min(-90).max(90).required(),
  longitude:   Joi.number().min(-180).max(180).required(),
  ville:      Joi.string().min(2).max(50).required(),
  horaires:   Joi.string().min(5).max(100).optional(),
})

// ─── PARKEUR FLUX VALIDATION ─────────────────────────────────

const entreeSchema = Joi.object({
  id_vehicule:    Joi.string().uuid().required(),
  etat_vehicule:  Joi.string().valid('bon_etat', 'besoin_maintenance', 'en_maintenance', 'retire').required(),
  commentaire:    Joi.string().max(500).allow('', null).optional(),
})

const sortieSchema = Joi.object({
  id_vehicule:    Joi.string().uuid().required(),
  etat_vehicule:  Joi.string().valid('bon_etat', 'besoin_maintenance', 'en_maintenance', 'retire').required(),
  commentaire:    Joi.string().max(500).allow('', null).optional(),
})

// ─── MAINTENANCE VALIDATION ───────────────────────────────────

const maintenanceSchema = Joi.object({
  id_vehicule:  Joi.string().uuid().required(),
  type:         Joi.string().valid('mecanique', 'electricite', 'carrosserie').required(),
  urgence:      Joi.string().valid('basse', 'normale', 'haute').optional().default('normale'),
  description:  Joi.string().min(5).max(1000).required()
    .messages({ 'string.min': 'La description doit faire au moins 5 caractères' }),
})

const updateMaintenanceStatusSchema = Joi.object({
  statut:      Joi.string().valid('en_attente', 'confirmee', 'en_reparation', 'terminee', 'bon_etat').required(),
  commentaire: Joi.string().max(500).allow('', null).optional(),
})

// ─── ANCIEN FORMAT (Compatibilité) ───────────────────────────

const receptionSchema = Joi.object({
  immatriculation: Joi.string().min(4).max(20).uppercase().required(),
  etat_vehicule:   Joi.string().valid('bon', 'a_verifier', 'dommage').required(),
  commentaire:     Joi.string().allow('', null).optional(),
})

const updateVehiculeSchema = Joi.object({
  immatriculation: Joi.string().min(4).max(20).uppercase().required(),
  marque:          Joi.string().min(2).required(),
  modele:          Joi.string().min(1).required(),
  categorie:       Joi.string().required(),
})

const mouvementsQuerySchema = Joi.object({
  search: Joi.string().allow('').optional(),
})

module.exports = {
  parkingSchema,
  entreeSchema,
  sortieSchema,
  maintenanceSchema,
  updateMaintenanceStatusSchema,
  receptionSchema,
  updateVehiculeSchema,
  mouvementsQuerySchema,
}
