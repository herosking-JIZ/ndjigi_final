const express = require('express');
const trajetPartageController = require('../controllers/trajetPartageController');
const { publicTokenLimiter, publicPositionLimiter } = require('../middlewares/publicRateLimit');
const photoController = require('../controllers/photoController');

const publicRoute = express.Router();

// GET /public/t/:token — Get public trajet data (rate limited, no auth)
publicRoute.get('/t/:token', publicTokenLimiter, trajetPartageController.getTrajetPublic);

// GET /public/t/:token/position — Get live vehicle position (rate limited, no auth)
publicRoute.get('/t/:token/position', publicPositionLimiter, trajetPartageController.getPositionLive);

// Seules les photos principales de profil sont publiques.
publicRoute.get('/profile-photos/:photoId', photoController.servePublicProfilePhoto);
publicRoute.get('/vehicle-photos/:photoId', photoController.servePublicVehiclePhoto);

module.exports = publicRoute;
