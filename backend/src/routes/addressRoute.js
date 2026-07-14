/**
 * ROUTES/ADDRESSROUTE.JS
 * Address management routes
 */

const express = require('express');
const addressController = require('../controllers/addressController');
const joiValidate = require('../middlewares/validate.middleware');
const {
  createAddressSchema,
  updateAddressSchema,
  listAddressQuerySchema,
  addressParamsSchema
} = require('../validators/address.validator');

const router = express.Router();

// ─── Create address ───────────────────────────────────────────
// POST /addresses
router.post(
  '/',
  joiValidate({ body: createAddressSchema }),
  addressController.createAddress
);

// ─── List addresses ───────────────────────────────────────────
// GET /addresses?favorite=true&label=Domicile&search=rue&page=1&limit=20
router.get(
  '/',
  joiValidate({ query: listAddressQuerySchema }),
  addressController.listAddresses
);

// ─── Get favorites ────────────────────────────────────────────
// GET /addresses/favorites?limit=10
router.get(
  '/favorites',
  addressController.getFavorites
);

// ─── Get single address ───────────────────────────────────────
// GET /addresses/:id
router.get(
  '/:id',
  joiValidate({ params: addressParamsSchema }),
  addressController.getAddress
);

// ─── Update address ───────────────────────────────────────────
// PATCH /addresses/:id
router.patch(
  '/:id',
  joiValidate({ params: addressParamsSchema, body: updateAddressSchema }),
  addressController.updateAddress
);

// ─── Toggle favorite ──────────────────────────────────────────
// PATCH /addresses/:id/favorite
router.patch(
  '/:id/favorite',
  joiValidate({ params: addressParamsSchema }),
  addressController.toggleFavorite
);

// ─── Delete address ───────────────────────────────────────────
// DELETE /addresses/:id
router.delete(
  '/:id',
  joiValidate({ params: addressParamsSchema }),
  addressController.deleteAddress
);

module.exports = router;
