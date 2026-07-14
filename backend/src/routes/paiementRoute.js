const express                                    = require('express');
const {
  PaiementController,
  PortefeuilleController,
  RechargeController,
  RetraitController,
  TransfertP2PController,
  VersementCommissionController
} = require('../controllers/paiementController');
const { authenticate }                           = require('../middlewares/authenticate');
const { authorize, can }                         = require('../middlewares/authorize');
const { rechargeSchema, retraitSchema, transfertP2PSchema, versementCommissionSchema } = require('../validators/paiement.validator');
const validate                                   = require('../middlewares/validate.middleware');

const paiementRoute = express.Router();
paiementRoute.use(authenticate);

// ── EXISTANTES ──
paiementRoute.get  ('/',                              authorize('admin'),        PaiementController.lister);
paiementRoute.get  ('/mes-paiements',                 can('paiement:lire'),      PaiementController.mesPaiements);
paiementRoute.post ('/',                              can('paiement:creer'),     PaiementController.creer);
paiementRoute.patch('/:id/confirmer',                 authorize('admin'),        PaiementController.confirmer);
paiementRoute.get  ('/portefeuille',                  can('portefeuille:lire'),  PortefeuilleController.monPortefeuille);
paiementRoute.get  ('/portefeuille/mouvements',       can('portefeuille:lire'),  PortefeuilleController.mouvements);
paiementRoute.patch('/portefeuille/:id/crediter',     authorize('admin'),        PortefeuilleController.crediter);
paiementRoute.patch('/portefeuille/:id/debiter',      authorize('admin'),        PortefeuilleController.debiter);

// ── NOUVELLES ROUTES (Phase 3) ──

// POST /paiement/recharge/initier (Recharge Orange Money via SinetPay)
paiementRoute.post('/recharge/initier',
  can('portefeuille:recharger'),
  validate(rechargeSchema),
  RechargeController.initier
);

// POST /paiement/retrait/initier (Retrait vers Orange Money via SinetPay)
paiementRoute.post('/retrait/initier',
  can('portefeuille:retirer'),
  validate(retraitSchema),
  RetraitController.initier
);

// POST /paiement/transfert (Transfert P2P interne N'DJIGI)
paiementRoute.post('/transfert',
  can('portefeuille:transferer'),
  validate(transfertP2PSchema),
  TransfertP2PController.transferer
);

// POST /paiement/commission/verser (Versement commission chauffeur → admin)
paiementRoute.post('/commission/verser',
  authorize('admin'),
  validate(versementCommissionSchema),
  VersementCommissionController.verser
);

module.exports = paiementRoute;
