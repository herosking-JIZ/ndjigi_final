const express = require('express');
const FaqController = require('../controllers/faqController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize, can } = require('../middlewares/authorize');
const joiValidate = require('../middlewares/validate.middleware');
const {
  createFaqSchema,
  updateFaqSchema,
  reorderFaqSchema,
  searchFaqSchema,
  listFaqSchema,
} = require('../validators/faqValidator');

const faqRoute = express.Router();

// ── Routes publiques (sans authentication) ──────────────────
faqRoute.get('/', joiValidate({ query: listFaqSchema }), FaqController.list);
faqRoute.get('/search', joiValidate({ query: searchFaqSchema }), FaqController.search);
faqRoute.get('/stats', FaqController.stats);
faqRoute.get('/:id', FaqController.getById);
faqRoute.patch('/:id/vote/helpful', FaqController.voteHelpful);
faqRoute.patch('/:id/vote/not-helpful', FaqController.voteNotHelpful);

// ── Routes protégées (admin) ───────────────────────────────
faqRoute.use(authenticate);

faqRoute.post(
  '/',
  authorize('admin'),
  joiValidate({ body: createFaqSchema }),
  FaqController.create
);

faqRoute.patch(
  '/:id',
  authorize('admin'),
  joiValidate({ body: updateFaqSchema }),
  FaqController.update
);

faqRoute.delete('/:id', authorize('admin'), FaqController.delete);

faqRoute.patch(
  '/reorder',
  authorize('admin'),
  joiValidate({ body: reorderFaqSchema }),
  FaqController.reorder
);

module.exports = faqRoute;
