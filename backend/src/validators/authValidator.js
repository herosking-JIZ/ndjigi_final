
const { body, validationResult } = require('express-validator');
const { getRolesValides }        = require('../config/roles');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides 😒.',
      errors:  errors.array().map(e => ({
        champ:   e.path,
        message: e.msg
      })),

    });
  }
  next();
};

const registerRules = [
  body('nom')
    .trim()
    .notEmpty().withMessage('Le nom est requis.')
    .isLength({ max: 100 }).withMessage('Nom trop long (100 caractères max).'),

  body('prenom')
    .trim()
    .notEmpty().withMessage('Le prénom est requis.')
    .isLength({ max: 100 }).withMessage('Prénom trop long (100 caractères max).'),

  body('email')
    .trim()
    .notEmpty().withMessage("L'email est requis.")
    .isEmail().withMessage('Format email invalide.')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email trop long (255 caractères max).'),

  body('numero_telephone')
    .trim()
    .notEmpty().withMessage('Le numéro de téléphone est requis.')
    .matches(/^\+?[\d\s\-]{8,20}$/).withMessage('Numéro de téléphone invalide (8 à 20 chiffres).'),

  body('mot_de_passe')
    .notEmpty().withMessage('Le mot de passe est requis.')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères.')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une majuscule.')
    .matches(/[0-9]/).withMessage('Le mot de passe doit contenir au moins un chiffre.'),

  body('role')
    .optional()
    .isIn(getRolesValides().filter(r => r !== 'admin'))
    .withMessage(`Rôle invalide. Valeurs acceptées : ${getRolesValides().filter(r => r !== 'admin').join(', ')}.`),

  validate
];

const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage("L'email est requis.")
    .isEmail().withMessage('Format email invalide.')
    .normalizeEmail(),

  body('mot_de_passe')
    .notEmpty().withMessage('Le mot de passe est requis.'),

  validate
];




const forgotPasswordRules = [
  body('email')
    .trim()
    .notEmpty().withMessage("L'email est requis.")
    .isEmail().withMessage('Format email invalide.')
    .normalizeEmail(),

  validate
];

const resetPasswordRules = [
  body('token')
    .trim()
    .notEmpty().withMessage('Le token est requis.'),

  body('newPassword')
    .notEmpty().withMessage('Le nouveau mot de passe est requis.'),

  validate
];

module.exports = {
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules
};
