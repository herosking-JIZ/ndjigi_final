// src/routes/vehiculeRoute.js
//importation des modules nécessaires
const express = require('express');
const vehiculeController  = require('../controllers/vehiculeController');
const { authenticate } = require('../middlewares/authenticate');
const { can } = require('../middlewares/authorize');

const vehiculeValidator = require('../validators/vehiculeValidator');
const joiValidate = require('../middlewares/validate.middleware');
const checkOwnership = require('../middlewares/checkOwnership');
const checkOwnershipTracking = require('../middlewares/checkOwnershipTracking');

const vehiculeRoute = express.Router();
// Toutes les routes véhicules nécessitent d'être connecté
vehiculeRoute.use(authenticate);

// Définition des routes pour les véhicules

// la liste de tous les véhicules (accessible par admin et chauffeur)

vehiculeRoute.get('/', can('vehicule:lire'), vehiculeController.lister);

// const checkOwnership = (model, paramId, champFK, champPK) => {

vehiculeRoute.post('/',
    can('vehicule:creer'),
    joiValidate({ body: vehiculeValidator.createVehiculeSchema }),
    vehiculeController.creer
);

vehiculeRoute.get('/:id',
    can('vehicule:lire'),
    checkOwnership('vehicule', 'id', 'id_proprietaire', 'id_vehicule'),
    vehiculeController.findOne)
;
// 
vehiculeRoute.get(
    '/:id/tracking',
    can('tracking:lire'),
    checkOwnershipTracking,
    vehiculeController.tracking
);


vehiculeRoute.patch (
    '/:id/position', 
    can('vehicule:modifier'),
    checkOwnershipTracking, 
    vehiculeController.updatePosition
);


vehiculeRoute.patch(
    '/:id',
    can('vehicule:modifier'),
    checkOwnership('vehicule', 'id', 'id_proprietaire', 'id_vehicule'),
    joiValidate({ body: vehiculeValidator.updateVehiculeSchema }),
    vehiculeController.modifier
);


vehiculeRoute.delete(
    '/:id',
    can('vehicule:supprimer'),
    checkOwnership('vehicule', 'id', 'id_proprietaire', 'id_vehicule'),
    vehiculeController.supprimer
);


module.exports = vehiculeRoute ;