const express = require('express');
const PromoController = require('../controllers/promoController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize, can } = require('../middlewares/authorize');
const {
    codePromoQuerySchema,
    codePromoParamsSchema,
    createCodePromoSchema,
    updateCodePromoSchema,
} = require('../validators/codePromo.validator');

const joiValidate = require('../middlewares/validate.middleware');



const promoRoute = express.Router();
promoRoute.use(authenticate);

// liter les codes promo        
promoRoute.get('/', authorize('admin'), joiValidate({ query: codePromoQuerySchema }), PromoController.lister);

// Créer un code promo
promoRoute.post('/', authorize('admin'), joiValidate({ body: createCodePromoSchema }), PromoController.creer);

// Valider un code promo
promoRoute.get('/:code/valider', can('trajet:reserver'), PromoController.valider);

// Modifier
promoRoute.put(
    '/:id',
    authorize('admin'),
    joiValidate({ params: codePromoParamsSchema, body: updateCodePromoSchema }),
    PromoController.modifier
);



// Toggle actif/inactif
promoRoute.patch(
    '/:id/toggle',
    authorize('admin'),
    joiValidate({ params: codePromoParamsSchema }),
    PromoController.toggleActif
);


module.exports = promoRoute;

