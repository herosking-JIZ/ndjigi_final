/**
 * CONTROLLERS/PAIEMENTCONTROLLER.JS
 */

const { prisma } = require('../config/db');
const { getRedisClient } = require('../config/redis');
const { v4: uuid } = require('uuid');
const sinetpayService = require('../services/sinetpayService');

const PaiementController = {

  // ── Lister les paiements ────────────────────────────────────
  async lister(req, res) {
    try {
      const { statut, methode, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {};
      if (statut)  where.statut  = statut;
      if (methode) where.methode = methode;

      const [paiements, total] = await Promise.all([
        prisma.paiement.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { date_paiement: 'desc' },
          include: {
            utilisateur: { select: { nom: true, prenom: true, email: true } }
          }
        }),
        prisma.paiement.count({ where })
      ]);

      return res.status(200).json({
        success: true,
        data: paiements,
        meta: { total, page: parseInt(page), limit: parseInt(limit) }
      });
    } catch (error) {
      console.error('[paiement.lister]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Créer un paiement ───────────────────────────────────────
  async creer(req, res) {
    try {
      const { montant, methode, id_objet_lie, reference_transaction } = req.body;
      const id_utilisateur = req.user.id_utilisateur;

      if (!montant || !methode) {
        return res.status(400).json({ success: false, message: 'montant et methode requis.' });
      }

      const paiement = await prisma.paiement.create({
        data: {
          id_utilisateur,
          montant:               parseFloat(montant),
          methode,
          id_objet_lie:          id_objet_lie         ?? null,
          reference_transaction: reference_transaction ?? null,
          statut: 'en_attente',
        }
      });

      return res.status(201).json({ success: true, data: paiement });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ success: false, message: 'Référence de transaction déjà utilisée.' });
      }
      console.error('[paiement.creer]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Confirmer un paiement ───────────────────────────────────
  async confirmer(req, res) {
    try {
      const { id } = req.params;
      const { reference_transaction } = req.body;

      const paiement = await prisma.paiement.findUnique({ where: { id_paiement: id } });
      if (!paiement) {
        return res.status(404).json({ success: false, message: 'Paiement introuvable.' });
      }

      const updated = await prisma.paiement.update({
        where: { id_paiement: id },
        data: {
          statut: 'confirme',
          ...(reference_transaction && { reference_transaction })
        }
      });

      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error('[paiement.confirmer]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Mes paiements ───────────────────────────────────────────
  async mesPaiements(req, res) {
    try {
      const id_utilisateur = req.user.id_utilisateur;
      const { page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const paiements = await prisma.paiement.findMany({
        where: { id_utilisateur },
        skip,
        take: parseInt(limit),
        orderBy: { date_paiement: 'desc' }
      });

      return res.status(200).json({ success: true, data: paiements });
    } catch (error) {
      console.error('[paiement.mesPaiements]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },
};

// ─────────────────────────────────────────────────────────────
// PORTEFEUILLE
// ─────────────────────────────────────────────────────────────

const PortefeuilleController = {

  // ── Mon portefeuille ────────────────────────────────────────
  async monPortefeuille(req, res) {
    try {
      const id_utilisateur = req.user.id_utilisateur;

      const portefeuille = await prisma.portefeuille.findUnique({
        where: { id_utilisateur },
      });

      if (!portefeuille) {
        return res.status(404).json({ success: false, message: 'Portefeuille introuvable.' });
      }

      return res.status(200).json({ success: true, data: portefeuille });
    } catch (error) {
      console.error('[portefeuille.monPortefeuille]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Créditer un portefeuille ────────────────────────────────
  async crediter(req, res) {
    try {
      const { id } = req.params;
      const { montant, type_operation, id_objet_lie } = req.body;

      if (!montant || parseFloat(montant) <= 0) {
        return res.status(400).json({ success: false, message: 'Montant invalide.' });
      }

      const result = await prisma.$transaction(async (tx) => {
        const portefeuille = await tx.portefeuille.findUnique({
          where: { id_portefeuille: id }
        });

        if (!portefeuille) throw new Error('Portefeuille introuvable.');

        const nouveau_solde = parseFloat(portefeuille.solde) + parseFloat(montant);

        const updated = await tx.portefeuille.update({
          where: { id_portefeuille: id },
          data: { solde: nouveau_solde }
        });

        await tx.mouvement_portefeuille.create({
          data: {
            id_portefeuille: id,
            type_operation:  type_operation ?? 'credit',
            montant:         parseFloat(montant),
            sens:            'credit',
            solde_apres:     nouveau_solde,
            id_objet_lie:    id_objet_lie ?? null,
          }
        });

        return updated;
      });

      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('[portefeuille.crediter]', error);
      return res.status(500).json({ success: false, message: error.message || 'Erreur serveur.' });
    }
  },

  // ── Débiter un portefeuille ─────────────────────────────────
  async debiter(req, res) {
    try {
      const { id } = req.params;
      const { montant, type_operation, id_objet_lie } = req.body;

      if (!montant || parseFloat(montant) <= 0) {
        return res.status(400).json({ success: false, message: 'Montant invalide.' });
      }

      const result = await prisma.$transaction(async (tx) => {
        const portefeuille = await tx.portefeuille.findUnique({
          where: { id_portefeuille: id }
        });

        if (!portefeuille) throw new Error('Portefeuille introuvable.');

        if (parseFloat(portefeuille.solde) < parseFloat(montant)) {
          throw new Error('Solde insuffisant.');
        }

        const nouveau_solde = parseFloat(portefeuille.solde) - parseFloat(montant);

        const updated = await tx.portefeuille.update({
          where: { id_portefeuille: id },
          data: { solde: nouveau_solde }
        });

        await tx.mouvement_portefeuille.create({
          data: {
            id_portefeuille: id,
            type_operation:  type_operation ?? 'debit',
            montant:         parseFloat(montant),
            sens:            'debit',
            solde_apres:     nouveau_solde,
            id_objet_lie:    id_objet_lie ?? null,
          }
        });

        return updated;
      });

      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      if (error.message === 'Solde insuffisant.') {
        return res.status(400).json({ success: false, message: error.message });
      }
      console.error('[portefeuille.debiter]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Historique des mouvements ───────────────────────────────
  async mouvements(req, res) {
    try {
      const id_utilisateur = req.user.id_utilisateur;
      const { page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const portefeuille = await prisma.portefeuille.findUnique({
        where: { id_utilisateur }
      });

      if (!portefeuille) {
        return res.status(404).json({ success: false, message: 'Portefeuille introuvable.' });
      }

      const mouvements = await prisma.mouvement_portefeuille.findMany({
        where: { id_portefeuille: portefeuille.id_portefeuille },
        skip,
        take: parseInt(limit),
        orderBy: { date_operation: 'desc' }
      });

      return res.status(200).json({ success: true, data: mouvements });
    } catch (error) {
      console.error('[portefeuille.mouvements]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },
};

// ─────────────────────────────────────────────────────────────
// WEBHOOK SINETPAY (Phase 2 - Webhook SinetPay)
// ─────────────────────────────────────────────────────────────

const WebhookController = {

  /**
   * POST /webhook/sinetpay
   * Reçoit les notifications SinetPay pour recharge/retrait
   * Valide signature HMAC, idempotence Redis, puis traite le paiement
   */
  async sinetpay(req, res) {
    try {
      // Récupérer la signature du header
      const headerSignature = req.headers['x-sinetpay-signature'];
      if (!headerSignature) {
        console.log('⚠️ Webhook SinetPay: signature manquante');
        return res.status(401).json({ success: false, message: 'Signature manquante' });
      }

      // Valider signature HMAC
      const rawBody = req.body; // Express.raw() fournit le buffer brut
      const isValid = sinetpayService.validerSignatureWebhook(
        Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(JSON.stringify(rawBody))
      , headerSignature);

      if (!isValid) {
        console.log('⚠️ Webhook SinetPay: signature invalide');
        return res.status(401).json({ success: false, message: 'Signature invalide' });
      }

      // Parser le body JSON
      const payload = typeof rawBody === 'string'
        ? JSON.parse(rawBody)
        : rawBody;

      const { transaction_id: transactionId, status, amount: montant } = payload;

      if (!transactionId || !status) {
        console.log('⚠️ Webhook SinetPay: transaction_id ou status manquant', payload);
        return res.status(400).json({ success: false, message: 'Données manquantes' });
      }

      // ✅ IDEMPOTENCE REDIS : vérifier si déjà traité
      const redis = getRedisClient();
      const processedKey = `sinetpay:processed:${transactionId}`;
      const alreadyProcessed = await redis.get(processedKey);

      if (alreadyProcessed) {
        console.log(`✅ Webhook SinetPay idempotent: ${transactionId} déjà traité`);
        return res.status(200).json({ success: true, message: 'Webhook already processed' });
      }

      // Trouver le paiement par référence
      const paiement = await prisma.paiement.findFirst({
        where: { reference_transaction: transactionId },
        include: { utilisateur: true, portefeuille: true }
      });

      if (!paiement) {
        console.log(`⚠️ Webhook SinetPay: paiement introuvable pour ${transactionId}`);
        // Quand même retourner 200 pour que SinetPay ne renyoie pas
        await redis.setex(processedKey, 172800, '1'); // TTL 48h
        return res.status(200).json({ success: true, message: 'Payment not found (webhook processed)' });
      }

      // Si le paiement est déjà traité, return immédiatement
      if (paiement.statut !== 'en_attente' && paiement.statut !== 'en_cours') {
        console.log(`⚠️ Webhook SinetPay: paiement ${transactionId} statut=${paiement.statut} (déjà traité)`);
        await redis.setex(processedKey, 172800, '1');
        return res.status(200).json({ success: true, message: 'Payment already processed' });
      }

      // ✅ TRAITEMENT SELON LE STATUS ET LE TYPE

      if (status === 'SUCCESS') {
        console.log(`✅ Webhook SinetPay SUCCESS: ${transactionId} (${montant} XOF)`);

        if (paiement.type === 'RECHARGE_SOLDE') {
          // Recharge : créditer le portefeuille
          const result = await prisma.$transaction(async (tx) => {
            // Récupérer le portefeuille de l'utilisateur
            const portefeuille = await tx.portefeuille.findUnique({
              where: { id_utilisateur: paiement.id_utilisateur }
            });

            if (!portefeuille) throw new Error('Portefeuille introuvable');

            const nouveau_solde = parseFloat(portefeuille.solde) + parseFloat(montant);

            // Mettre à jour le paiement
            await tx.paiement.update({
              where: { id_paiement: paiement.id_paiement },
              data: { statut: 'complete' }
            });

            // Créditer le portefeuille
            const portefeuille_updated = await tx.portefeuille.update({
              where: { id_portefeuille: portefeuille.id_portefeuille },
              data: { solde: nouveau_solde }
            });

            // Créer le mouvement
            await tx.mouvement_portefeuille.create({
              data: {
                id_portefeuille: portefeuille.id_portefeuille,
                type_operation: 'RECHARGE_MOBILE_MONEY',
                montant: parseFloat(montant),
                sens: 'credit',
                solde_apres: nouveau_solde,
                id_objet_lie: paiement.id_paiement
              }
            });

            return portefeuille_updated;
          });

          console.log(`✅ Webhook SinetPay: RECHARGE complétée ${transactionId}`);
        }
        else if (paiement.type === 'RETRAIT') {
          // Retrait : le solde a déjà été débité à l'initiation, juste mettre à jour le statut
          await prisma.paiement.update({
            where: { id_paiement: paiement.id_paiement },
            data: { statut: 'complete' }
          });

          console.log(`✅ Webhook SinetPay: RETRAIT complété ${transactionId}`);
        }

      }
      else if (status === 'FAILED') {
        console.log(`⚠️ Webhook SinetPay FAILED: ${transactionId}`);

        const result = await prisma.$transaction(async (tx) => {
          // Mettre à jour le paiement
          await tx.paiement.update({
            where: { id_paiement: paiement.id_paiement },
            data: { statut: 'echec' }
          });

          // Si c'était un retrait, rembourser le solde
          if (paiement.type === 'RETRAIT') {
            const portefeuille = await tx.portefeuille.findUnique({
              where: { id_utilisateur: paiement.id_utilisateur }
            });

            if (portefeuille) {
              const nouveau_solde = parseFloat(portefeuille.solde) + parseFloat(montant);

              await tx.portefeuille.update({
                where: { id_portefeuille: portefeuille.id_portefeuille },
                data: { solde: nouveau_solde }
              });

              // Créer un mouvement d'annulation
              await tx.mouvement_portefeuille.create({
                data: {
                  id_portefeuille: portefeuille.id_portefeuille,
                  type_operation: 'RETRAIT_ANNULE',
                  montant: parseFloat(montant),
                  sens: 'credit',
                  solde_apres: nouveau_solde,
                  id_objet_lie: paiement.id_paiement
                }
              });
            }
          }
        });

        console.log(`✅ Webhook SinetPay: FAILED traité ${transactionId}`);
      }

      // Marquer comme traité dans Redis (TTL 48h)
      await redis.setex(processedKey, 172800, '1');

      // Émettre Socket.io pour notifier le user (à implémenter avec Socket.io)
      // TODO: io.to(paiement.id_utilisateur).emit('portefeuille:mis_a_jour', {...})

      return res.status(200).json({ success: true, message: 'Webhook processed' });

    } catch (error) {
      console.error('❌ Webhook SinetPay erreur:', error.message);
      // Toujours retourner 200 pour que SinetPay ne renvoyez pas
      return res.status(200).json({ success: false, message: error.message });
    }
  },
};

// ─────────────────────────────────────────────────────────────
// RECHARGE PORTEFEUILLE (Phase 3 - Recharge)
// ─────────────────────────────────────────────────────────────

const RechargeController = {

  /**
   * POST /paiement/recharge/initier
   * Initie une recharge de portefeuille via SinetPay (Orange Money)
   */
  async initier(req, res) {
    try {
      const id_utilisateur = req.user.id_utilisateur;
      const { montant, numero_telephone } = req.body;

      // Récupérer le portefeuille
      const portefeuille = await prisma.portefeuille.findUnique({
        where: { id_utilisateur }
      });

      if (!portefeuille) {
        return res.status(404).json({ success: false, message: 'Portefeuille introuvable' });
      }

      // Vérifier statut portefeuille
      if (portefeuille.statut !== 'actif') {
        return res.status(403).json({ success: false, message: 'Portefeuille bloqué' });
      }

      // Générer transaction ID
      const transactionId = `RCH-${uuid()}`;

      // Créer le paiement en attente
      const paiement = await prisma.paiement.create({
        data: {
          id_utilisateur,
          montant: parseFloat(montant),
          methode: 'MOBILE_MONEY',
          type: 'RECHARGE_SOLDE',
          statut: 'en_attente',
          reference_transaction: transactionId
        }
      });

      // Appeler SinetPay
      let paymentUrl = null;
      try {
        const sinetpayResult = await sinetpayService.initierPaiement({
          transactionId,
          montant: parseFloat(montant),
          description: 'Recharge portefeuille N\'DJIGI',
          numeroTelephone,
          nomClient: `${req.user.prenom || ''} ${req.user.nom || ''}`.trim() || 'Client'
        });

        paymentUrl = sinetpayResult.paymentUrl;
      } catch (err) {
        // Si SinetPay échoue, marquer le paiement comme échec
        await prisma.paiement.update({
          where: { id_paiement: paiement.id_paiement },
          data: { statut: 'echec' }
        });
        console.error('❌ SinetPay erreur recharge:', err.message);
        return res.status(502).json({ success: false, message: 'Service SinetPay indisponible' });
      }

      // Cacher dans Redis pour tracking
      const redis = getRedisClient();
      await redis.setex(`sinetpay:pending:${transactionId}`, 900, paiement.id_paiement); // TTL 15 min

      return res.status(200).json({
        success: true,
        data: {
          id_paiement: paiement.id_paiement,
          paymentUrl,
          transactionId,
          montant
        }
      });

    } catch (error) {
      console.error('[recharge.initier]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  },
};

// ─────────────────────────────────────────────────────────────
// RETRAIT (Phase 3 - Retrait vers Orange Money)
// ─────────────────────────────────────────────────────────────

const RetraitController = {

  /**
   * POST /paiement/retrait/initier
   * Initie un retrait de portefeuille vers compte Orange Money (SinetPay)
   * Débit préventif du solde (remboursé si SinetPay échoue)
   */
  async initier(req, res) {
    try {
      const id_utilisateur = req.user.id_utilisateur;
      const { montant, numero_telephone } = req.body;

      // Récupérer le portefeuille
      const portefeuille = await prisma.portefeuille.findUnique({
        where: { id_utilisateur }
      });

      if (!portefeuille) {
        return res.status(404).json({ success: false, message: 'Portefeuille introuvable' });
      }

      // Vérifier statut portefeuille
      if (portefeuille.statut !== 'actif') {
        return res.status(403).json({ success: false, message: 'Portefeuille bloqué' });
      }

      // Vérifier solde suffisant
      if (parseFloat(portefeuille.solde) < parseFloat(montant)) {
        return res.status(400).json({ success: false, message: 'Solde insuffisant' });
      }

      // Générer transaction ID
      const transactionId = `RTR-${uuid()}`;

      // ✅ DÉBIT PRÉVENTIF : débiter avant d'appeler SinetPay
      let paiement;
      try {
        const result = await prisma.$transaction(async (tx) => {
          // Créer le paiement
          const p = await tx.paiement.create({
            data: {
              id_utilisateur,
              montant: parseFloat(montant),
              methode: 'MOBILE_MONEY',
              type: 'RETRAIT',
              statut: 'en_cours',
              reference_transaction: transactionId
            }
          });

          // Débiter le portefeuille
          const nouveau_solde = parseFloat(portefeuille.solde) - parseFloat(montant);
          await tx.portefeuille.update({
            where: { id_portefeuille: portefeuille.id_portefeuille },
            data: { solde: nouveau_solde }
          });

          // Créer mouvement de retrait
          await tx.mouvement_portefeuille.create({
            data: {
              id_portefeuille: portefeuille.id_portefeuille,
              type_operation: 'RETRAIT_INITIE',
              montant: parseFloat(montant),
              sens: 'debit',
              solde_apres: nouveau_solde,
              id_objet_lie: p.id_paiement
            }
          });

          return p;
        });

        paiement = result;
      } catch (err) {
        console.error('[retrait.transaction]', err);
        return res.status(500).json({ success: false, message: 'Erreur lors du débit du solde' });
      }

      // Appeler SinetPay
      try {
        const sinetpayResult = await sinetpayService.initierRetrait({
          transactionId,
          montant: parseFloat(montant),
          numeroTelephone,
          nomBeneficiaire: `${req.user.prenom || ''} ${req.user.nom || ''}`.trim() || 'Bénéficiaire'
        });

        console.log(`✅ Retrait SinetPay initié: ${transactionId}`);
      } catch (err) {
        // ❌ REVERSAL : SinetPay a échoué, rembourser le solde
        console.error('[retrait.sinetpay_error]', err.message);

        try {
          const nouveau_solde = parseFloat(portefeuille.solde);
          await prisma.$transaction(async (tx) => {
            await tx.paiement.update({
              where: { id_paiement: paiement.id_paiement },
              data: { statut: 'echec' }
            });

            await tx.portefeuille.update({
              where: { id_portefeuille: portefeuille.id_portefeuille },
              data: { solde: nouveau_solde }
            });

            await tx.mouvement_portefeuille.create({
              data: {
                id_portefeuille: portefeuille.id_portefeuille,
                type_operation: 'RETRAIT_ANNULE',
                montant: parseFloat(montant),
                sens: 'credit',
                solde_apres: nouveau_solde,
                id_objet_lie: paiement.id_paiement
              }
            });
          });
        } catch (reversal_err) {
          console.error('[retrait.reversal_error]', reversal_err);
        }

        return res.status(502).json({ success: false, message: 'Service SinetPay indisponible' });
      }

      // Cacher dans Redis
      const redis = getRedisClient();
      await redis.setex(`sinetpay:pending:${transactionId}`, 86400, paiement.id_paiement); // TTL 24h

      return res.status(200).json({
        success: true,
        data: {
          id_paiement: paiement.id_paiement,
          statut: 'en_cours',
          message: 'Retrait initié. Vous recevrez une confirmation SMS dans 1 à 5 minutes.',
          montant,
          transactionId
        }
      });

    } catch (error) {
      console.error('[retrait.initier]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  },
};

// ─────────────────────────────────────────────────────────────
// TRANSFERT P2P (Phase 3 - Transfert interne N'DJIGI)
// ─────────────────────────────────────────────────────────────

const TransfertP2PController = {

  /**
   * POST /paiement/transfert
   * Transfert d'argent entre deux portefeuilles N'DJIGI
   * Transaction Prisma atomique (4 opérations : débits/crédits + mouvements)
   */
  async transferer(req, res) {
    try {
      const id_expediteur = req.user.id_utilisateur;
      const { id_destinataire, montant, note } = req.body;

      // Vérifier que ce ne sont pas le même utilisateur
      if (id_expediteur === id_destinataire) {
        return res.status(400).json({ success: false, message: 'Impossible de transférer à soi-même' });
      }

      // Récupérer les deux portefeuilles en parallèle
      const [portefeuille_exp, portefeuille_dest] = await Promise.all([
        prisma.portefeuille.findUnique({ where: { id_utilisateur: id_expediteur } }),
        prisma.portefeuille.findUnique({ where: { id_utilisateur: id_destinataire } })
      ]);

      if (!portefeuille_exp) {
        return res.status(404).json({ success: false, message: 'Votre portefeuille introuvable' });
      }

      if (!portefeuille_dest) {
        return res.status(404).json({ success: false, message: 'Destinataire introuvable' });
      }

      // Vérifier statuts
      if (portefeuille_exp.statut !== 'actif') {
        return res.status(403).json({ success: false, message: 'Votre portefeuille est bloqué' });
      }

      if (portefeuille_dest.statut !== 'actif') {
        return res.status(403).json({ success: false, message: 'Portefeuille du destinataire bloqué' });
      }

      // Vérifier solde expéditeur
      if (parseFloat(portefeuille_exp.solde) < parseFloat(montant)) {
        return res.status(400).json({ success: false, message: 'Solde insuffisant' });
      }

      // Générer transaction IDs
      const transactionId = `TRF-${uuid()}`;

      // ✅ TRANSACTION PRISMA ATOMIQUE (6 opérations)
      const result = await prisma.$transaction(async (tx) => {
        const nouveau_solde_exp = parseFloat(portefeuille_exp.solde) - parseFloat(montant);
        const nouveau_solde_dest = parseFloat(portefeuille_dest.solde) + parseFloat(montant);

        // 1. Débiter expéditeur
        await tx.portefeuille.update({
          where: { id_portefeuille: portefeuille_exp.id_portefeuille },
          data: { solde: nouveau_solde_exp }
        });

        // 2. Créditer destinataire
        await tx.portefeuille.update({
          where: { id_portefeuille: portefeuille_dest.id_portefeuille },
          data: { solde: nouveau_solde_dest }
        });

        // 3. Paiement débit (expéditeur)
        const paiement_debit = await tx.paiement.create({
          data: {
            id_utilisateur: id_expediteur,
            montant: parseFloat(montant),
            methode: 'PORTEFEUILLE',
            type: 'TRANSFERT_P2P_DEBIT',
            statut: 'complete',
            reference_transaction: `${transactionId}-DEBIT`,
            id_objet_lie: id_destinataire
          }
        });

        // 4. Paiement crédit (destinataire)
        const paiement_credit = await tx.paiement.create({
          data: {
            id_utilisateur: id_destinataire,
            montant: parseFloat(montant),
            methode: 'PORTEFEUILLE',
            type: 'TRANSFERT_P2P_CREDIT',
            statut: 'complete',
            reference_transaction: `${transactionId}-CREDIT`,
            id_objet_lie: id_expediteur
          }
        });

        // 5. Mouvement expéditeur
        await tx.mouvement_portefeuille.create({
          data: {
            id_portefeuille: portefeuille_exp.id_portefeuille,
            type_operation: 'TRANSFERT_EMIS',
            montant: parseFloat(montant),
            sens: 'debit',
            solde_apres: nouveau_solde_exp,
            id_objet_lie: paiement_debit.id_paiement
          }
        });

        // 6. Mouvement destinataire
        await tx.mouvement_portefeuille.create({
          data: {
            id_portefeuille: portefeuille_dest.id_portefeuille,
            type_operation: 'TRANSFERT_RECU',
            montant: parseFloat(montant),
            sens: 'credit',
            solde_apres: nouveau_solde_dest,
            id_objet_lie: paiement_credit.id_paiement
          }
        });

        return { paiement_debit, paiement_credit, nouveau_solde_exp, nouveau_solde_dest };
      });

      // Récupérer infos destinataire pour réponse
      const utilisateur_dest = await prisma.utilisateur.findUnique({
        where: { id_utilisateur: id_destinataire },
        select: { prenom: true, nom: true }
      });

      return res.status(200).json({
        success: true,
        data: {
          montant,
          expediteur_solde_apres: result.nouveau_solde_exp,
          destinataire_nom: `${utilisateur_dest?.prenom || ''} ${utilisateur_dest?.nom || ''}`.trim(),
          transactionId,
          note
        }
      });

    } catch (error) {
      console.error('[transfert.transferer]', error);
      return res.status(500).json({ success: false, message: error.message || 'Erreur serveur' });
    }
  },
};

// ─────────────────────────────────────────────────────────────
// VERSEMENT COMMISSION (Phase 3 - Commission chauffeur → admin)
// ─────────────────────────────────────────────────────────────

const VersementCommissionController = {

  /**
   * POST /paiement/commission/verser
   * Verse la commission d'un chauffeur vers le compte admin (PLATEFORME_WALLET_ID)
   * Réservé à l'admin
   */
  async verser(req, res) {
    try {
      const { id_chauffeur } = req.body;

      // Récupérer chauffeur et ses infos de commission
      const chauffeur = await prisma.chauffeur.findUnique({
        where: { id_utilisateur: id_chauffeur },
        include: { utilisateur: { select: { prenom: true, nom: true } } }
      });

      if (!chauffeur) {
        return res.status(404).json({ success: false, message: 'Chauffeur introuvable' });
      }

      // Vérifier qu'il y a une commission à verser
      if (parseFloat(chauffeur.solde_commission_du) <= 0) {
        return res.status(400).json({ success: false, message: 'Aucune commission due pour ce chauffeur' });
      }

      const montant_commission = parseFloat(chauffeur.solde_commission_du);

      // Récupérer les portefeuilles
      const [portefeuille_chauffeur, portefeuille_admin] = await Promise.all([
        prisma.portefeuille.findUnique({ where: { id_utilisateur: id_chauffeur } }),
        prisma.portefeuille.findUnique({ where: { id_utilisateur: process.env.PLATEFORME_USER_ID } })
      ]);

      if (!portefeuille_chauffeur) {
        return res.status(404).json({ success: false, message: 'Portefeuille chauffeur introuvable' });
      }

      if (!portefeuille_admin) {
        return res.status(404).json({ success: false, message: 'Portefeuille administrateur introuvable' });
      }

      // Vérifier que le portefeuille chauffeur a le solde
      if (parseFloat(portefeuille_chauffeur.solde) < montant_commission) {
        return res.status(400).json({ success: false, message: 'Solde du chauffeur insuffisant pour le versement' });
      }

      // ✅ TRANSACTION ATOMIQUE
      const transactionId = `COM-${uuid()}`;
      const result = await prisma.$transaction(async (tx) => {
        const nouveau_solde_chauffeur = parseFloat(portefeuille_chauffeur.solde) - montant_commission;
        const nouveau_solde_admin = parseFloat(portefeuille_admin.solde) + montant_commission;

        // Mettre à jour chauffeur.solde_commission_du à 0
        await tx.chauffeur.update({
          where: { id_utilisateur: id_chauffeur },
          data: { solde_commission_du: 0 }
        });

        // Débiter portefeuille chauffeur
        await tx.portefeuille.update({
          where: { id_portefeuille: portefeuille_chauffeur.id_portefeuille },
          data: { solde: nouveau_solde_chauffeur }
        });

        // Créditer portefeuille admin
        await tx.portefeuille.update({
          where: { id_portefeuille: portefeuille_admin.id_portefeuille },
          data: { solde: nouveau_solde_admin }
        });

        // Mouvement chauffeur
        await tx.mouvement_portefeuille.create({
          data: {
            id_portefeuille: portefeuille_chauffeur.id_portefeuille,
            type_operation: 'VERSEMENT_COMMISSION',
            montant: montant_commission,
            sens: 'debit',
            solde_apres: nouveau_solde_chauffeur
          }
        });

        // Mouvement admin
        await tx.mouvement_portefeuille.create({
          data: {
            id_portefeuille: portefeuille_admin.id_portefeuille,
            type_operation: 'COMMISSION_RECUE',
            montant: montant_commission,
            sens: 'credit',
            solde_apres: nouveau_solde_admin
          }
        });

        // Créer paiement
        await tx.paiement.create({
          data: {
            id_utilisateur: id_chauffeur,
            montant: montant_commission,
            methode: 'PORTEFEUILLE',
            type: 'COMMISSION',
            statut: 'complete',
            reference_transaction: transactionId
          }
        });

        return { nouveau_solde_chauffeur, nouveau_solde_admin };
      });

      return res.status(200).json({
        success: true,
        data: {
          montant_verse: montant_commission,
          chauffeur_nom: `${chauffeur.utilisateur?.prenom || ''} ${chauffeur.utilisateur?.nom || ''}`.trim(),
          chauffeur_solde_apres: result.nouveau_solde_chauffeur,
          admin_solde_apres: result.nouveau_solde_admin
        }
      });

    } catch (error) {
      console.error('[versement_commission.verser]', error);
      return res.status(500).json({ success: false, message: error.message || 'Erreur serveur' });
    }
  },
};

module.exports = {
  PaiementController,
  PortefeuilleController,
  WebhookController,
  RechargeController,
  RetraitController,
  TransfertP2PController,
  VersementCommissionController
};
