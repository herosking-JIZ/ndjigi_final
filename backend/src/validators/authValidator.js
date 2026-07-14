
const { body, validationResult } = require('express-validator');
const { getRolesValides }        = require('../config/roles');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'DonnÃ©es invalides ðŸ˜’.',
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
    .isLength({ max: 100 }).withMessage('Nom trop long (100 caractÃ¨res max).'),

  body('prenom')
    .trim()
    .notEmpty().withMessage('Le prÃ©nom est requis.')
    .isLength({ max: 100 }).withMessage('PrÃ©nom trop long (100 caractÃ¨res max).'),

  body('email')
    .trim()
    .notEmpty().withMessage("L'email est requis.")
    .isEmail().withMessage('Format email invalide.')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email trop long (255 caractÃ¨res max).'),

  body('numero_telephone')
    .trim()
    .notEmpty().withMessage('Le numÃ©ro de tÃ©lÃ©phone est requis.')
    .matches(/^\+?[\d\s\-]{8,20}$/).withMessage('NumÃ©ro de tÃ©lÃ©phone invalide (8 Ã  20 chiffres).'),

  body('mot_de_passe')
    .notEmpty().withMessage('Le mot de passe est requis.')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractÃ¨res.')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une majuscule.')
    .matches(/[0-9]/).withMessage('Le mot de passe doit contenir au moins un chiffre.'),

  body('role')
    .optional()
    .isIn(getRolesValides().filter(r => r !== 'admin'))
    .withMessage(`RÃ´le invalide. Valeurs acceptÃ©es : ${getRolesValides().filter(r => r !== 'admin').join(', ')}.`),

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
