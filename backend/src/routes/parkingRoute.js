const express                                                    = require('express');
const { ParkingController, GestionnaireController, IncidentController } = require('../controllers/parkingController');
const ParkeurController                                          = require('../controllers/parkeurController');
const MaintenanceController                                      = require('../controllers/maintenanceController');
const ParkingMediaController                                     = require('../controllers/parkingMediaController');
const { authenticate }                                           = require('../middlewares/authenticate');
const { authorize, can }                                         = require('../middlewares/authorize');
const { parkingSchema, receptionSchema, sortieSchema, entreeSchema, maintenanceSchema, updateMaintenanceStatusSchema, updateVehiculeSchema, mouvementsQuerySchema } = require('../validators/parkingValidation');
const joiValidate = require('../middlewares/validate.middleware');
const { requireParkingAccess } = require('../middlewares/parkingAccess');
const { uploadPhoto } = require('../middlewares/photoUpload.middleware');

const parkingRoute = express.Router();
parkingRoute.use(authenticate);

parkingRoute.get  ('/',                           can('parking:lire'),     ParkingController.lister);
parkingRoute.get  ('/mouvements',                 can('parking:lire'),     ParkingController.mouvements);
parkingRoute.get  ('/incidents',                  authorize('admin'),       IncidentController.lister);
parkingRoute.get  ('/incidents/:id',              can('incident:lire'),    IncidentController.findOne);
parkingRoute.post ('/incidents',                  can('incident:declarer'), IncidentController.declarer);
parkingRoute.post ('/gestionnaires',              authorize('admin'),       GestionnaireController.assigner);
parkingRoute.get  ('/:id',                        can('parking:lire'),     ParkingController.findOne);
parkingRoute.post ('/',     joiValidate({ body: parkingSchema }), authorize('admin'),       ParkingController.creer);
parkingRoute.patch('/:id',     joiValidate({ body: parkingSchema }), authorize('admin'),       ParkingController.modifier);
parkingRoute.put  ('/:id',     joiValidate({ body: parkingSchema }), authorize('admin'),       ParkingController.modifier);
parkingRoute.post ('/:id/mouvement',              can('parking:gerer'), requireParkingAccess, ParkingController.ajouterMouvement);
parkingRoute.get  ('/:id_parking/gestionnaires',  authorize('admin'),       GestionnaireController.parParking);

// ─── PARKEUR ENDPOINTS ────────────────────────────────────────
parkingRoute.get  ('/:parkingId/detail-parkeur',      can('parking:lire'), requireParkingAccess, ParkeurController.detailParking);
parkingRoute.get  ('/:parkingId/vehicules',           can('parking:lire'), requireParkingAccess, ParkeurController.vehiculesGares);
parkingRoute.get  ('/:parkingId/mouvements-parkeur',  can('parking:lire'), requireParkingAccess, ParkeurController.mouvementsParkeur);
parkingRoute.post ('/:parkingId/entree',              joiValidate({ body: entreeSchema }), can('parking:gerer'), requireParkingAccess, ParkeurController.enregistrerEntree);
parkingRoute.post ('/:parkingId/sortie',              joiValidate({ body: sortieSchema }), can('parking:gerer'), requireParkingAccess, ParkeurController.enregistrerSortie);

// ─── MAINTENANCE ENDPOINTS ────────────────────────────────────
parkingRoute.get  ('/:parkingId/maintenance',         can('parking:lire'), requireParkingAccess, MaintenanceController.listerDemandes);
parkingRoute.post ('/:parkingId/maintenance',         joiValidate({ body: maintenanceSchema }), can('parking:gerer'), requireParkingAccess, MaintenanceController.creerDemande);
parkingRoute.get  ('/:parkingId/maintenance/:maintenanceId',      can('parking:lire'), requireParkingAccess, MaintenanceController.obtenirDemande);
parkingRoute.patch('/:parkingId/maintenance/:maintenanceId',      joiValidate({ body: updateMaintenanceStatusSchema }), can('parking:gerer'), requireParkingAccess, MaintenanceController.mettreAJourStatut);

// ─── PHOTO ENDPOINTS ──────────────────────────────────────────


parkingRoute.post('/:parkingId/mouvements/:mouvementId/photos', can('parking:gerer'), requireParkingAccess, uploadPhoto.single('photo'), ParkingMediaController.uploadMouvement);
parkingRoute.post('/:parkingId/maintenance/:maintenanceId/photos', can('parking:gerer'), requireParkingAccess, uploadPhoto.single('photo'), ParkingMediaController.uploadMaintenance);
parkingRoute.get('/:parkingId/photos/:photoId', can('parking:lire'), requireParkingAccess, ParkingMediaController.serve);
parkingRoute.delete('/:parkingId/photos/:photoId', can('parking:gerer'), requireParkingAccess, ParkingMediaController.remove);
module.exports = parkingRoute;
