const express = require('express');
const trajetPartageController = require('../controllers/trajetPartageController');
const { publicTokenLimiter, publicPositionLimiter } = require('../middlewares/publicRateLimit');

const publicRoute = express.Router();

// GET /public/t/:token — Get public trajet data (rate limited, no auth)
publicRoute.get('/t/:token', publicTokenLimiter, trajetPartageController.getTrajetPublic);

// GET /public/t/:token/position — Get live vehicle position (rate limited, no auth)
publicRoute.get('/t/:token/position', publicPositionLimiter, trajetPartageController.getPositionLive);

module.exports = publicRoute;
