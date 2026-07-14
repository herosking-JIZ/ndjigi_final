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
    checkLocationOwnership,
    LocationController.findOne
);

locationRoute.patch(
    '/:id/accepter',
    can('location:gerer'),
    checkLocationOwnership,
    LocationController.accepter
);

locationRoute.patch(
    '/:id/refuser',
    can('location:gerer'),
    checkLocationOwnership,
    LocationController.refuser
);

module.exports = locationRoute;
