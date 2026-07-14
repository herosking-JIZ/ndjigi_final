const express = require('express');
const trajetPartageController = require('../controllers/trajetPartageController');
const { authenticate } = require('../middlewares/authenticate');
const { can } = require('../middlewares/authorize');

const trajetPartageRoute = express.Router();

trajetPartageRoute.use(authenticate);

trajetPartageRoute.post('/:id/partager', can('trajet:lire'), trajetPartageController.createPartage);
trajetPartageRoute.delete('/:id/partager', can('trajet:lire'), trajetPartageController.revokePartage);

module.exports = trajetPartageRoute;
