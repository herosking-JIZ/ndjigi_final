const express = require('express')
const { can } = require('../middlewares/authorize')
const { authenticate } = require('../middlewares/authenticate')
const supportController = require('../controllers/supportController')
const joiValidate = require('../middlewares/validate.middleware')
const {
  createTicketSchema,
  updateStatutSchema,
  updatePrioriteSchema,
  listTicketsSchema,
} = require('../validators/supportValidation')

const router = express.Router()
router.use(authenticate)

// Création : tout utilisateur connecté
router.post('/', joiValidate({ body: createTicketSchema }), supportController.create)

// Liste : réservée admin (le controller a quand même un filtre d'appartenance)
router.get('/', can('support:lire_ticket'), joiValidate({ query: listTicketsSchema }), supportController.list)

// Détail : ouvert, MAIS appartenance vérifiée dans le controller (anti-IDOR)
router.get('/:id', supportController.getOne)

// Mutations : ADMIN uniquement → protégées par can()
router.patch('/:id/statut',      can('support:mise_a_jour_statut'), joiValidate({ body: updateStatutSchema }), supportController.updateStatut)
router.patch('/:id/priorite', can('support:mise_a_jour_statut'), joiValidate({ body: updatePrioriteSchema }), supportController.updatePriorite)

module.exports = router
