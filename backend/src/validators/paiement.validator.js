/**
 * PAIEMENT VALIDATOR
 * Schemas Joi pour valider les payloads des opérations financières
 */

const Joi = require('joi');

// Schema pour recharge portefeuille (Orange Money)
const rechargeSchema = Joi.object({
  montant: Joi.number()
    .min(500)
    .max(1000000)
    .required()
    .messages({
      'number.base': 'Montant doit être un nombre',
      'number.min': 'Montant minimum : 500 XOF',
      'number.max': 'Montant maximum : 1 000 000 XOF',
      'any.required': 'Montant est requis',
    }),
  numero_telephone: Joi.string()
    .pattern(/^\+226\d{8}$/)
    .required()
    .messages({
      'string.pattern.base': 'Numéro invalide. Format attendu: +226XXXXXXXX',
      'any.required': 'Numéro téléphone est requis',
    }),
}).unknown(false);

// Schema pour retrait vers compte Orange Money
const retraitSchema = Joi.object({
  montant: Joi.number()
    .min(1000)
    .max(500000)
    .required()
    .messages({
      'number.base': 'Montant doit être un nombre',
      'number.min': 'Montant minimum : 1 000 XOF',
      'number.max': 'Montant maximum : 500 000 XOF',
      'any.required': 'Montant est requis',
    }),
  numero_telephone: Joi.string()
    .pattern(/^\+226\d{8}$/)
    .required()
    .messages({
      'string.pattern.base': 'Numéro invalide. Format attendu: +226XXXXXXXX',
      'any.required': 'Numéro téléphone est requis',
    }),
}).unknown(false);

// Schema pour transfert P2P entre deux portefeuilles N'DJIGI
const transfertP2PSchema = Joi.object({
  id_destinataire: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'ID destinataire invalide (UUID requis)',
      'any.required': 'ID destinataire est requis',
    }),
  montant: Joi.number()
    .min(100)
    .max(500000)
    .required()
    .messages({
      'number.base': 'Montant doit être un nombre',
      'number.min': 'Montant minimum : 100 XOF',
      'number.max': 'Montant maximum : 500 000 XOF',
      'any.required': 'Montant est requis',
    }),
  note: Joi.string()
    .max(200)
    .optional()
    .messages({
      'string.max': 'Note maximum 200 caractères',
    }),
}).unknown(false);

// Schema pour versement de commission (admin seulement)
const versementCommissionSchema = Joi.object({
  id_chauffeur: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'ID chauffeur invalide (UUID requis)',
      'any.required': 'ID chauffeur est requis',
    }),
}).unknown(false);

module.exports = {
  rechargeSchema,
  retraitSchema,
  transfertP2PSchema,
  versementCommissionSchema,
};
