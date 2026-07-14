const express = require('express');
const router = express.Router();

const tarifCategorieZoneController = require('../controllers/tarifCategorieZoneController');
const joiValidate = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

const {
    tarifZoneParamSchema,
    upsertTarifSchema,
} = require('../validators/tarifCategorieZoneValidator');

router.use(authenticate);

// GET /config/tarifs/:id_zone — tarifs d'une zone pour toutes ses catégories
router.get('/:id_zone',
    authorize('admin'),
    joiValidate({ params: tarifZoneParamSchema }),
    tarifCategorieZoneController.listerParZone
);

// PUT /config/tarifs — upsert d'un tarif zone × catégorie
router.put('/',
    authorize('admin'),
    joiValidate({ body: upsertTarifSchema }),
    tarifCategorieZoneController.upsert
);

module.exports = router;