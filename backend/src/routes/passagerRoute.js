// ─────────────────────────────────────────────────────────────
// ROUTES/PASSAGERROUTE.JS
// ─────────────────────────────────────────────────────────────
const express             = require('express');
const PassagerController  = require('../controllers/passagerController');
const { authenticate }    = require('../middlewares/authenticate');
const { authorize, can }  = require('../middlewares/authorize');

const passagerRoute = express.Router();
passagerRoute.use(authenticate);

passagerRoute.get ('/',              authorize('admin'),        PassagerController.lister);
passagerRoute.get ('/historique',    can('trajet:lire'),        PassagerController.historique);
passagerRoute.get ('/:id',           can('passager:lire'),      PassagerController.findOne);
passagerRoute.patch('/adresses',     can('profil:modifier'),    PassagerController.updateAdresses);

module.exports = passagerRoute;
