const express = require('express');
const router = express.Router();

const zoneTarifaireController = require('../controllers/zoneTarifaireController');
const joiValidate = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

const {
    zoneIdParamSchema,
    zoneQuerySchema,
    createZoneSchema,
    updateZoneSchema,
} = require('../validators/zoneTarifaireValidator');

router.use(authenticate);

// Lister les zones (+ ?corbeille=true pour la corbeille)
router.get('/',
    authorize('admin'),
    joiValidate({ query: zoneQuerySchema }),
    zoneTarifaireController.lister
);

// Voir une zone précise
router.get('/:id',
    authorize('admin'),
    joiValidate({ params: zoneIdParamSchema }),
    zoneTarifaireController.findOne
);

// Créer une zone
router.post('/',
    authorize('admin'),
    joiValidate({ body: createZoneSchema }),
    zoneTarifaireController.create
);

// Modifier une zone
router.put('/:id',
    authorize('admin'),
    joiValidate({ params: zoneIdParamSchema, body: updateZoneSchema }),
    zoneTarifaireController.modifier
);

// Restaurer depuis la corbeille
router.put('/:id/restaurer',
    authorize('admin'),
    joiValidate({ params: zoneIdParamSchema }),
    zoneTarifaireController.restaurer
);

// Soft delete → corbeille (ou hard delete si aucun trajet)
router.delete('/:id',
    authorize('admin'),
    joiValidate({ params: zoneIdParamSchema }),
    zoneTarifaireController.supprimer
);

// Hard delete définitif depuis la corbeille
router.delete('/:id/forcer',
    authorize('admin'),
    joiValidate({ params: zoneIdParamSchema }),
    zoneTarifaireController.supprimerDefinitivement
);

module.exports = router;