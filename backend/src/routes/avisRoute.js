const express                           = require('express');
const    AvisController                 = require('../controllers/avisController');
const { authenticate }                  = require('../middlewares/authenticate');
const { authorize, can }                = require('../middlewares/authorize');

const avisRoute = express.Router();
avisRoute.use(authenticate);

avisRoute.get  ('/avis',                 can('avis:lire'),         AvisController.lister);
avisRoute.post ('/avis',                 can('avis:creer'),        AvisController.creer);
avisRoute.get  ('/avis/:id/note',        can('avis:lire'),         AvisController.noteMoyenne);

module.exports = avisRoute;
