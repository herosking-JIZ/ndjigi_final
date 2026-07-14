const express                                                    = require('express');
const multer                                                     = require('multer');
const path                                                       = require('path');
const { ParkingController, GestionnaireController, IncidentController } = require('../controllers/parkingController');
const ParkeurController                                          = require('../controllers/parkeurController');
const MaintenanceController                                      = require('../controllers/maintenanceController');
const PhotoController                                            = require('../controllers/photoController');
const { authenticate }                                           = require('../middlewares/authenticate');
const { authorize, can }                                         = require('../middlewares/authorize');
const { parkingSchema, receptionSchema, sortieSchema, entreeSchema, maintenanceSchema, updateMaintenanceStatusSchema, updateVehiculeSchema, mouvementsQuerySchema } = require('../validators/parkingValidation');
const joiValidate = require('../middlewares/validate.middleware');

// ─── Multer config pour les photos ────────────────────────────
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'backend/uploads');
  },
  filename: (req, file, cb) => {
    const uuid = require('crypto').randomUUID();
    const ext = path.extname(file.originalname);
    cb(null, `${uuid}${ext}`);
  }
});

const photoUpload = multer({
  storage: photoStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  }
});

const parkingRoute = express.Router();
parkingRoute.use(authenticate);

parkingRoute.get  ('/',                           can('parking:lire'),     ParkingController.lister);
parkingRoute.get  ('/mouvements',                 can('parking:lire'),     ParkingController.mouvements);
parkingRoute.get  ('/:id',                        can('parking:lire'),     ParkingController.findOne);
parkingRoute.post ('/',     joiValidate({ body: parkingSchema }), authorize('admin'),       ParkingController.creer);
parkingRoute.patch('/:id',     joiValidate({ body: parkingSchema }), authorize('admin'),       ParkingController.modifier);
parkingRoute.put  ('/:id',     joiValidate({ body: parkingSchema }), authorize('admin'),       ParkingController.modifier);
parkingRoute.post ('/:id/mouvement',              can('parking:gerer'),    ParkingController.ajouterMouvement);
parkingRoute.post ('/gestionnaires',              authorize('admin'),       GestionnaireController.assigner);
parkingRoute.get  ('/:id_parking/gestionnaires',  authorize('admin'),       GestionnaireController.parParking);
parkingRoute.get  ('/incidents',                  authorize('admin'),       IncidentController.lister);
parkingRoute.get  ('/incidents/:id',              can('incident:lire'),    IncidentController.findOne);
parkingRoute.post ('/incidents',                  can('incident:declarer'), IncidentController.declarer);

// ─── PARKEUR ENDPOINTS ────────────────────────────────────────
parkingRoute.get  ('/:parkingId/detail-parkeur',      can('parking:lire'),     ParkeurController.detailParking);
parkingRoute.get  ('/:parkingId/vehicules',           can('parking:lire'),     ParkeurController.vehiculesGares);
parkingRoute.get  ('/:parkingId/mouvements-parkeur',  can('parking:lire'),     ParkeurController.mouvementsParkeur);
parkingRoute.post ('/:parkingId/entree',              joiValidate({ body: entreeSchema }), can('parking:gerer'), ParkeurController.enregistrerEntree);
parkingRoute.post ('/:parkingId/sortie',              joiValidate({ body: sortieSchema }), can('parking:gerer'), ParkeurController.enregistrerSortie);

// ─── MAINTENANCE ENDPOINTS ────────────────────────────────────
parkingRoute.get  ('/:parkingId/maintenance',         can('parking:lire'),     MaintenanceController.listerDemandes);
parkingRoute.post ('/:parkingId/maintenance',         joiValidate({ body: maintenanceSchema }), can('parking:gerer'), MaintenanceController.creerDemande);
parkingRoute.get  ('/:parkingId/maintenance/:maintenanceId',      can('parking:lire'),     MaintenanceController.obtenirDemande);
parkingRoute.patch('/:parkingId/maintenance/:maintenanceId',      joiValidate({ body: updateMaintenanceStatusSchema }), can('parking:gerer'), MaintenanceController.mettreAJourStatut);

// ─── PHOTO ENDPOINTS ──────────────────────────────────────────


parkingRoute.post('/mouvements/:mouvementId/photos',    photoUpload.single('photo'), can('parking:gerer'), PhotoController.uploadPhoto);
parkingRoute.post('/maintenance/:maintenanceId/photos', photoUpload.single('photo'), can('parking:gerer'), PhotoController.uploadPhoto);
parkingRoute.get ('/photos/:photoId',                  PhotoController.servePhoto);
module.exports = parkingRoute;
