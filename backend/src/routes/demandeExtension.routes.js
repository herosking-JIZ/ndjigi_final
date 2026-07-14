/**
 * ROUTES/DEMANDEEXTENSION.ROUTES.JS
 * Extension requests management routes
 */

const express = require('express');
const demandeExtensionController = require('../controllers/demandeExtension.controller');
const joiValidate = require('../middlewares/validate.middleware');
const { authorize } = require('../middlewares/authorize');
const {
  createDemandeExtensionSchema,
  updateStatutSchema,
  listDemandesQuerySchema,
  demandeParamsSchema
} = require('../validators/demandeExtension.validator');

const router = express.Router();

// ─── Create extension request ──────────────────────────────
// POST /demandes-extension
router.post(
  '/',
  joiValidate({ body: createDemandeExtensionSchema }),
  demandeExtensionController.create
);

// ─── Get user's extension requests ────────────────────────
// GET /demandes-extension/mes-demandes
router.get(
  '/mes-demandes',
  demandeExtensionController.getMesDemandes
);

// ─── Get all demandes (admin) ─────────────────────────────
// GET /demandes-extension/admin
router.get(
  '/admin',
  authorize('admin'),
  joiValidate({ query: listDemandesQuerySchema }),
  demandeExtensionController.getAllDemandes
);

// ─── Update request status (admin only) ────────────────────
// PATCH /demandes-extension/:id/statut
router.patch(
  '/:id/statut',
  authorize('admin'),
  joiValidate({ params: demandeParamsSchema, body: updateStatutSchema }),
  demandeExtensionController.updateStatut
);

module.exports = router;
