const Joi = require('joi')

const listTransactionsSchema = Joi.object({
  page:   Joi.number().integer().min(1).default(1),
  limit:  Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().allow('').optional(),
  type:   Joi.string()
    .valid('PAIEMENT_TRAJET', 'COMMISSION', 'REMBOURSEMENT', 'RECHARGE_SOLDE', 'RETRAIT')
    .allow('')
    .optional(),
})

module.exports = { listTransactionsSchema }