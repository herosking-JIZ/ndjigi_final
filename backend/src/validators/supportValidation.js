const Joi = require('joi')

const SUJETS  = ['probleme_technique', 'question_sur_une_course', 'reclamation', 'autre']
const STATUTS = ['ouvert', 'en_cours', 'resolu', 'ferme']
const PRIORITES = ['faible', 'normale', 'haute', 'urgente']

const createTicketSchema = Joi.object({
  sujet: Joi.string().valid(...SUJETS).required()
    .messages({ 'any.only': `Sujet invalide. Valeurs acceptées : ${SUJETS.join(', ')}` }),
  description: Joi.string().min(10).required()
    .messages({ 'string.min': 'La description doit faire au moins 10 caractères' }),
  id_trajet:   Joi.string().uuid().optional().allow(null),
  id_paiement: Joi.string().uuid().optional().allow(null),
  id_location: Joi.string().uuid().optional().allow(null),
  priorite: Joi.string().valid(...PRIORITES).default('normale'),
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
  note_resolution: Joi.string().max(2000).allow('', null).optional(),
})

const updatePrioriteSchema = Joi.object({
  priorite: Joi.string().valid(...PRIORITES).required(),
})

module.exports = {
  listTicketsSchema, updateStatutSchema, updatePrioriteSchema, createTicketSchema,
}
