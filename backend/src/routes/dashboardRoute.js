const express = require('express');
const dashboardController = require('../controllers/kpiController');

const router = express.Router();

router.get('/kpis', dashboardController.getKpis);
router.get('/top-chauffeurs', dashboardController.getTopChauffeurs);
router.get('/courses-semaine', dashboardController.getWeeklyStats);
router.get('/moyens-paiement', dashboardController.getPaymentMethodsStats);
router.get('/evolution-mensuelle', dashboardController.getEvolutionMensuelle);


module.exports = router;