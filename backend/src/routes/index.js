const express = require('express');
const keycloakAuthRoutes = require('./keycloakAuthRoutes');
const publicRoute = require('./publicRoute');
const trajetRoute = require('./trajetRoute');
const trajetPartageRoute = require('./trajetPartageRoute');
const vehiculeRoute = require('./vehiculeRoute');
const locationRoute = require('./locationRoute');
const parkingRoute = require('./parkingRoute');
const chauffeurRoute = require('./chauffeurRoute');
const affectationRoute = require('./affectationRoute');
const avisRoute = require('./avisRoute');
const notificationRoute = require('./notificationRoute');
const paiementRoute = require('./paiementRoute');
const passagerRoute = require('./passagerRoute');
const promoRoute = require('./promoRoute');
const proprietaireRoute = require('./proprietaireRoute');
const reservationRoute = require('./reservationRoute');
const conversationRoute = require('./conversationRoute');
const utilisateurRoute = require('./utilisateurRoute');
const gestionnaireRoute = require('./gestionnaireRoute');
const zoneTarifaireRoute = require('./zoneTarifaireRoute');
const dashboardRoute = require('./dashboardRoute');
const documentRoute = require('./documentRoute');
const photoRoute = require('./photoRoute');
const addressRoute = require('./addressRoute');
const contactRoute = require('./contactRoute');
const supportRoutes = require('./supportRoute');
const financesRoutes = require('./financesRoute');
const faqRoute = require('./faqRoute');
const webhookRoute = require('./webhookRoute');

const zoneRoutes = require('./zoneTarifaireRoute');
const categorieRoutes = require('./categorieVehiculeRoute');
const tarifRoutes = require('./tarifCategorieZoneRoute');
const demandeExtensionRoutes = require('./demandeExtension.routes');
const moyenPaiementRoutes = require('./moyenPaiementRoute');

const { authenticateKeycloak } = require('../middlewares/authenticateKeycloak');
const { authenticate } = require('../middlewares/authenticate');
const requirePermanentPassword = require('../middlewares/requirePermanentPassword');

console.log('Chargement des routes...');

const router = express.Router();

// ✨ Phase 4: Routes Keycloak + Public routes (no auth required)
// Enregistrées en PREMIER avant le middleware d'authentification
router.use('/auth', keycloakAuthRoutes);
router.use('/public', publicRoute);
router.use('/webhook', webhookRoute);

// Appliquer l'authentification (supports both Keycloak and local/JWT) à toutes les autres routes
// Try Keycloak first, fallback to local JWT auth
router.use((req, res, next) => {
  authenticateKeycloak(req, res, (err) => {
    if (err || !req.user) {
      authenticate(req, res, next);
    } else {
      next();
    }
  });
});

// Enforce permanent password requirement (must be AFTER authentication)
router.use(requirePermanentPassword);

router.use('/trajets', trajetRoute);
router.use('/trajets', trajetPartageRoute);
router.use('/vehicules', vehiculeRoute);
router.use('/locations', locationRoute);
router.use('/chauffeurs', chauffeurRoute);
router.use('/affectation', affectationRoute);
router.use('/avis', avisRoute);
router.use('/notification', notificationRoute);
router.use('/paiement', paiementRoute);
router.use('/parkings', parkingRoute);
router.use('/pasager', passagerRoute);
router.use('/code-promo', promoRoute);
router.use('/proprietaire', proprietaireRoute);
router.use('/reservation', reservationRoute);
router.use('/conversations', conversationRoute);
router.use('/utilisateurs', utilisateurRoute);
router.use('/users', utilisateurRoute); // Alias pour compatibilité Flutter
router.use('/admin/gestionnaires', gestionnaireRoute);
// ✅ Routes pour gestionnaire authentifié (opérations personnelles)
router.use('/gestionnaire', gestionnaireRoute);
router.use('/vehicule', vehiculeRoute);
router.use('/zone-tarifaire', zoneTarifaireRoute);
router.use('/dashboard', dashboardRoute);
router.use('/documents', documentRoute);
router.use('/photos', photoRoute);
router.use('/addresses', addressRoute);
router.use('/contacts-confiance', contactRoute);
router.use('/config/zones', zoneRoutes);
router.use('/config/categories', categorieRoutes);
router.use('/config/tarifs', tarifRoutes);
router.use('/config/moyens-paiement', moyenPaiementRoutes);
router.use('/support/tickets', supportRoutes);
router.use('/finances', financesRoutes);
router.use('/faqs', faqRoute);
router.use('/demandes-extension', demandeExtensionRoutes);






module.exports = router;
