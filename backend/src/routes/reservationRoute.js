const express                = require('express');
const ReservationController  = require('../controllers/reservationController');
const { authenticate }       = require('../middlewares/authenticate');
const { authorize, can }     = require('../middlewares/authorize');

const reservationRoute = express.Router();
reservationRoute.use(authenticate);

reservationRoute.get  ('/',                      authorize('admin'),      ReservationController.lister);
reservationRoute.get  ('/mes-reservations',      can('trajet:lire'),      ReservationController.mesReservations);
reservationRoute.post ('/:id_trajet/reserver',   can('trajet:reserver'),  ReservationController.reserver);
reservationRoute.patch('/:id/annuler',           can('trajet:annuler'),   ReservationController.annuler);

module.exports = reservationRoute;
