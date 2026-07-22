// src/routes/locationRoute.js
const express = require('express');
const LocationController = require('../controllers/locationController');
const { authenticate } = require('../middlewares/authenticate');
const { can } = require('../middlewares/authorize');
const { checkLocationOwnership } = require('../middlewares/checkLocationOwnership');
const joiValidate = require('../middlewares/validate.middleware');
const locationValidator = require('../validators/locationValidator');

const locationRoute = express.Router();
locationRoute.use(authenticate);

// ⚠️ Les segments littéraux (/vehicules, /mes-demandes, /mes-locations) doivent
// être déclarés avant la route générique /:id pour ne pas être interceptés.

locationRoute.get(
    '/vehicules',
    can('location:creer'),
    joiValidate({ query: locationValidator.rechercherVehiculesQuerySchema }),
    LocationController.rechercherVehicules
);

locationRoute.get(
    '/vehicules/:id',
    can('location:creer'),
    LocationController.detailVehicule
);

locationRoute.get('/mes-demandes', can('location:lire'), LocationController.mesDemandes);

locationRoute.post(
    '/',
    can('location:creer'),
    joiValidate({ body: locationValidator.createLocationSchema }),
    LocationController.creerDemande
);

locationRoute.get('/mes-locations', can('location:lire'), LocationController.mesLocations);

locationRoute.get(
    '/:id',
    can('location:lire'),
    joiValidate({ params: locationValidator.locationParamsSchema }),
    checkLocationOwnership,
    LocationController.findOne
);

locationRoute.patch(
    '/:id/accepter',
    can('location:gerer'),
    joiValidate({ params: locationValidator.locationParamsSchema }),
    checkLocationOwnership,
    LocationController.accepter
);

locationRoute.patch(
    '/:id/refuser',
    can('location:gerer'),
    joiValidate({ params: locationValidator.locationParamsSchema }),
    checkLocationOwnership,
    LocationController.refuser
);

locationRoute.patch(
    '/:id/annuler',
    can('location:annuler'),
    joiValidate({ params: locationValidator.locationParamsSchema }),
    checkLocationOwnership,
    LocationController.annuler
);

locationRoute.patch(
    '/:id/terminer',
    can('location:gerer'),
    joiValidate({ params: locationValidator.locationParamsSchema }),
    checkLocationOwnership,
    LocationController.terminer
);

module.exports = locationRoute;
