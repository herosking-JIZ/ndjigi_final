const express                  = require('express');
const ProprietaireController   = require('../controllers/proprietaireController');
const { authenticate }         = require('../middlewares/authenticate');
const { authorize, can }       = require('../middlewares/authorize');

const proprietaireRoute = express.Router();
proprietaireRoute.use(authenticate);

proprietaireRoute.get ('/',                  authorize('admin'),           ProprietaireController.lister);
proprietaireRoute.get ('/mes-vehicules',     can('vehicule:lire'),         ProprietaireController.mesVehicules);
proprietaireRoute.get ('/:id',               can('proprietaire:lire'),     ProprietaireController.findOne);
proprietaireRoute.get ('/:id/statistiques',  can('proprietaire:lire'),     ProprietaireController.statistiques);
proprietaireRoute.patch('/:id/valider',      authorize('admin'),           ProprietaireController.valider);

module.exports = proprietaireRoute;
   