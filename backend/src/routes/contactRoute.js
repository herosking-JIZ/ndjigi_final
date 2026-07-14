/**
 * ROUTES/CONTACTROUTE.JS
 * Emergency contact management routes
 */

const express = require('express');
const contactController = require('../controllers/contactController');
const joiValidate = require('../middlewares/validate.middleware');
const {
  createContactSchema,
  updateContactSchema,
  listContactQuerySchema,
  contactParamsSchema
} = require('../validators/contact.validator');

const router = express.Router();

// ─── Create contact ───────────────────────────────────────────
// POST /contacts-confiance
router.post(
  '/',
  joiValidate({ body: createContactSchema }),
  contactController.createContact
);

// ─── List contacts ────────────────────────────────────────────
// GET /contacts-confiance?relation=parent&search=nom&page=1&limit=20
router.get(
  '/',
  joiValidate({ query: listContactQuerySchema }),
  contactController.listContacts
);

// ─── Get statistics ───────────────────────────────────────────
// GET /contacts-confiance/stats
router.get(
  '/stats',
  contactController.getStats
);

// ─── Get by relation type ─────────────────────────────────────
// GET /contacts-confiance/by-relation/:relation?limit=10
router.get(
  '/by-relation/:relation',
  contactController.getByRelation
);

// ─── Get single contact ───────────────────────────────────────
// GET /contacts-confiance/:id
router.get(
  '/:id',
  joiValidate({ params: contactParamsSchema }),
  contactController.getContact
);

// ─── Update contact ───────────────────────────────────────────
// PATCH /contacts-confiance/:id
router.patch(
  '/:id',
  joiValidate({ params: contactParamsSchema, body: updateContactSchema }),
  contactController.updateContact
);

// ─── Delete contact ───────────────────────────────────────────
// DELETE /contacts-confiance/:id
router.delete(
  '/:id',
  joiValidate({ params: contactParamsSchema }),
  contactController.deleteContact
);

module.exports = router;
