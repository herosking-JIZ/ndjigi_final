const Joi = require('joi')

const TYPES = ['CARTE_BANCAIRE', 'MOBILE_MONEY', 'PORTEFEUILLE']

const idSchema = Joi.object({ id: Joi.string().uuid().required() })

const createSchema = Joi.object({
  type: Joi.string().valid(...TYPES).required(),
  nom: Joi.string().trim().min(2).max(80).required(),
  fournisseur: Joi.string().trim().max(80).allow('', null).optional(),
  instructions: Joi.string().trim().max(500).allow('', null).optional(),
})

module.exports = { idSchema, createSchema }
