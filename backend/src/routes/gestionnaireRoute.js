const express = require('express')
const rateLimit = require('express-rate-limit')
const { authenticate } = require('../middlewares/authenticate')
const { authorize } = require('../middlewares/authorize')
const joiValidate = require('../middlewares/validate.middleware')
const { createGestionnaireSchema } = require('../validators/gestionnaireValidation')
const GestionnaireController = require('../controllers/gestionnaireController')

const router = express.Router()

// Apply authentication to all routes
router.use(authenticate)

/**
 * GET /gestionnaire/me/parking
 * Récupère le parking assigné au gestionnaire authentifié
 *
 * Auth: Bearer token
 * Accessible à: gestionnaires authentifiés
 */
router.get(
  '/me/parking',
  GestionnaireController.getMyParking
)

/**
 * POST /admin/gestionnaires
 * Create a new gestionnaire (admin only)
 * Rate limit: 10 creations per hour per admin
 */
const createGestionnaireLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyGenerator: (req) => req.user.id_utilisateur,
  message: {
    success: false,
    message: 'Trop de demandes. Réessayez dans 1 heure.'
  }
})

router.post(
  '/',
  createGestionnaireLimiter,
  joiValidate({ body: createGestionnaireSchema }),
  authorize('admin'),
  GestionnaireController.create
)

module.exports = router
