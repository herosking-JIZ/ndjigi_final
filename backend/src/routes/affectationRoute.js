const express               = require('express');
const AffectationController = require('../controllers/affectationController');
const { authenticate }      = require('../middlewares/authenticate');
const { authorize, can }    = require('../middlewares/authorize');

const affectationRoute = express.Router();
affectationRoute.use(authenticate);


affectationRoute.post  ('/affectations',                    authorize('admin'),       AffectationController.assigner);
affectationRoute.patch ('/affectations/:id/terminer',       authorize('admin'),       AffectationController.terminer);
affectationRoute.get   ('/:id_vehicule/affectations',       can('vehicule:lire'),     AffectationController.historique);
affectationRoute.get   ('/chauffeur/:id_chauffeur/affectation', can('vehicule:lire'), AffectationController.affectationChauffeur);

module.exports = affectationRoute;
