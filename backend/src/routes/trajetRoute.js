const express = require('express');
const TrajetController = require('../controllers/trajetController');
const { authenticate } = require('../middlewares/authenticate');
const { can } = require('../middlewares/authorize');
const checkTrajetChauffeur = require('../middlewares/checkTrajetOwnership');
const checkTrajetParticipant = require('../middlewares/checkTrajetParticipant');
const validate = require('../middlewares/validate.middleware');
const {
  trajetParamsSchema,
  trajetQuerySchema,
  demandeVtcSchema,
  tarifVtcSchema,
  annulationTrajetSchema,
  terminerTrajetSchema,
  demarrerTrajetSchema,
  trajetActifQuerySchema,
} = require('../validators/trajetValidator');

const trajetRoute = express.Router();
trajetRoute.use(authenticate);

// ✅ Routes statiques AVANT /:id pour éviter les conflits de paramètres
trajetRoute.get('/historique', can('trajet:lire'), validate({ query: trajetQuerySchema }), TrajetController.historique)
trajetRoute.get('/actif', can('trajet:lire'), validate({ query: trajetActifQuerySchema }), TrajetController.actif)
trajetRoute.get('/', can('trajet:lire'), validate({ query: trajetQuerySchema }), TrajetController.lister)
trajetRoute.get('/:id', can('trajet:lire'), validate({ params: trajetParamsSchema }), checkTrajetParticipant, TrajetController.findOne)
trajetRoute.get('/:id/pin-demarrage', can('trajet:lire'), validate({ params: trajetParamsSchema }), checkTrajetParticipant, TrajetController.obtenirPinDemarrage)

trajetRoute.post('/tarif', can('trajet:lire'), validate({ body: tarifVtcSchema }), TrajetController.calculerTarif)
trajetRoute.post('/', can('trajet:creer'), TrajetController.creer)
trajetRoute.post('/demande', can('trajet:reserver'), validate({ body: demandeVtcSchema }), TrajetController.demander)
trajetRoute.post('/:id/promo', can('trajet:lire'), TrajetController.appliquerPromo)

trajetRoute.patch('/:id', can('trajet:modifier'), TrajetController.update)
trajetRoute.patch('/:id/accepter', can('trajet:accepter'), validate({ params: trajetParamsSchema }), checkTrajetChauffeur, TrajetController.accepter)
trajetRoute.patch('/:id/refuser', can('trajet:accepter'), validate({ params: trajetParamsSchema }), checkTrajetChauffeur, TrajetController.refuser)
trajetRoute.patch('/:id/confirmer', can('trajet:lire'), validate({ params: trajetParamsSchema }), TrajetController.confirmer)
trajetRoute.patch('/:id/confirmer-identite', can('trajet:lire'), validate({ params: trajetParamsSchema }), TrajetController.confirmerIdentite)
trajetRoute.patch('/:id/signaler-arrivee', can('trajet:demarrer'), validate({ params: trajetParamsSchema }), checkTrajetChauffeur, TrajetController.signalerArrivee)
trajetRoute.patch('/:id/demarrer', can('trajet:demarrer'), validate({ params: trajetParamsSchema, body: demarrerTrajetSchema }), checkTrajetChauffeur, TrajetController.demarrer)
trajetRoute.patch('/:id/terminer', can('trajet:terminer'), validate({ params: trajetParamsSchema, body: terminerTrajetSchema }), checkTrajetChauffeur, TrajetController.terminer)
trajetRoute.patch('/:id/annuler', can('trajet:annuler'), validate({ params: trajetParamsSchema, body: annulationTrajetSchema }), TrajetController.annuler)

module.exports = trajetRoute;
