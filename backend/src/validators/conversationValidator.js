const Joi = require('joi');

// ─────────────────────────────────────────────
// req.params → GET /conversations/:id/messages
// ─────────────────────────────────────────────
const conversationParamsSchema = Joi.object({
  id: Joi.string()
    .guid()
    .required()
    .messages({
      'any.required': 'L\'ID de la conversation est obligatoire',
      'string.guid': 'L\'ID de la conversation doit être un UUID valide'
    })
});

// ─────────────────────────────────────────────
// req.query → GET /conversations/:id/messages?page=1&limit=30
// ─────────────────────────────────────────────
const conversationMessagesQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'La page doit être un nombre',
      'number.integer': 'La page doit être un entier',
      'number.min': 'La page doit être au moins 1'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(30)
    .messages({
      'number.base': 'La limite doit être un nombre',
      'number.integer': 'La limite doit être un entier',
      'number.min': 'La limite doit être au moins 1',
      'number.max': 'La limite ne peut pas dépasser 50'
    })
});

module.exports = {
  conversationParamsSchema,
  conversationMessagesQuerySchema
};
