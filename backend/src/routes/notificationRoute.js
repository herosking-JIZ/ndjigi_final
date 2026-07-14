const express                = require('express');
const NotificationController = require('../controllers/notificationController');
const { authenticate }       = require('../middlewares/authenticate');
const { authorize, can }     = require('../middlewares/authorize');

const notificationRoute = express.Router();
notificationRoute.use(authenticate);

notificationRoute.get   ('/',          can('notification:lire'),  NotificationController.mesNotifications);
notificationRoute.patch ('/:id/lire',  can('notification:lire'),  NotificationController.marquerLue);
notificationRoute.patch ('/lire-tout', can('notification:lire'),  NotificationController.marquerToutesLues);
notificationRoute.post  ('/',          authorize('admin'),         NotificationController.envoyer);
notificationRoute.delete('/:id',       can('notification:lire'),  NotificationController.supprimer);

module.exports = notificationRoute;
