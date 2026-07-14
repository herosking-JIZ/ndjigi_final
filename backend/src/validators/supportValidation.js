const Joi = require('joi')

const SUJETS  = ['probleme_technique', 'question_sur_une_course', 'reclamation', 'autre']
const STATUTS = ['ouvert', 'en_cours', 'resolu', 'ferme']

const createTicketSchema = Joi.object({
  sujet: Joi.string().valid(...SUJETS).required()
    .messages({ 'any.only': `Sujet invalide. Valeurs acceptées : ${SUJETS.join(', ')}` }),
  description: Joi.string().min(10).required()
    .messages({ 'string.min': 'La description doit faire au moins 10 caractères' }),
  id_trajet:   Joi.string().uuid().optional().allow(null),
  id_paiement: Joi.string().uuid().optional().allow(null),
  id_location: Joi.string().uuid().optional().allow(null),
})
  .oxor('id_trajet', 'id_paiement', 'id_location')

const listTicketsSchema = Joi.object({
  page:   Joi.number().integer().min(1).default(1),
  limit:  Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().allow('').optional(),
  statut: Joi.string().valid(...STATUTS).allow('').optional(),
})

const updateStatutSchema = Joi.object({
  statut: Joi.string().valid(...STATUTS).required()
    .messages({ 'any.only': `Statut invalide. Valeurs acceptées : ${STATUTS.join(', ')}` }),
})

const remboursementSchema = Joi.object({
  id_utilisateur: Joi.string().uuid().required(),
  montant:        Joi.number().positive().required()
    .messages({ 'number.positive': 'Le montant doit être supérieur à 0' }),
  motif:          Joi.string().min(3).required(),
  id_ticket:      Joi.string().uuid().required(),
})
const eligibiliteSchema = Joi.object({
  eligible: Joi.boolean().required()
    .messages({ 'any.required': 'Le champ "eligible" (true/false) est requis' }),
})

module.exports = {
  listTicketsSchema, updateStatutSchema, createTicketSchema, remboursementSchema, eligibiliteSchema,
}