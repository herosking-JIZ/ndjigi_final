/**
 * CONTROLLERS/LOCATIONCONTROLLER.JS
 *
 * Gère les locations de véhicules (location courte durée) : recherche et
 * demande côté passager, liste/détail/accepter/refuser/annuler côté
 * propriétaire et passager.
 *
 * Convention des statuts (colonne `statut` en VarChar libre, pas d'enum Prisma) :
 *   en_attente | active | terminee | annulee | refusee
 * "Historique" (Flutter) = terminee | annulee | refusee
 *
 * Chat : une `conversation` (id_location) n'est créée qu'à l'acceptation de
 * la demande par le propriétaire (accepter()) — pas avant, le propriétaire
 * doit d'abord se prononcer. Le moteur (conversationController/Route +
 * socket conversationHandler/Service) est générique et déjà en place.
 */

const { prisma } = require('../config/db');

const LOCATION_COMMISSION_RATE = parseFloat(process.env.LOCATION_COMMISSION_RATE || '0.15');
const STATUTS_LOCATION_BLOQUANTS = ['active'];

const STATUT_GROUPS = {
  en_attente: ['en_attente'],
  active: ['active'],
  historique: ['terminee', 'annulee', 'refusee'],
};

function noteMoyenne(avisList) {
  if (!avisList || avisList.length === 0) return null;
  return avisList.reduce((somme, a) => somme + (a.note ?? 0), 0) / avisList.length;
}

const LocationController = {

  // ── Rechercher les véhicules disponibles à la location (passager) ──
  // GET /locations/vehicules?id_categorie=&date_debut=&date_fin=&page=&limit=
  async rechercherVehicules(req, res) {
    try {
      const { id_categorie, date_debut, date_fin, page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      const conflitPeriode = date_debut && date_fin
        ? {
            location: {
              none: {
                statut: { in: ['en_attente', 'active'] },
                date_debut: { lt: new Date(date_fin) },
                date_fin: { gt: new Date(date_debut) },
              },
            },
          }
        : {};

      const where = {
        supprime_le: null,
        statut: 'disponible',
        ...(id_categorie ? { id_categorie } : {}),
        vehicule_location: { isNot: null, ...conflitPeriode },
      };

      const [vehicules, total] = await Promise.all([
        prisma.vehicule.findMany({
          where,
          skip,
          take: limit,
          include: {
            vehicule_location: true,
            photos: {
              where: { deletedAt: null },
              orderBy: [
                { is_principale: 'desc' },
                { ordre: 'asc' },
                { uploadedAt: 'desc' },
              ],
              take: 1,
            },
          },
          orderBy: { annee: 'desc' },
        }),
        prisma.vehicule.count({ where }),
      ]);

      const data = vehicules.map((v) => ({
        id_vehicule: v.id_vehicule,
        marque: v.marque,
        modele: v.modele,
        annee: v.annee,
        couleur: v.couleur,
        photo_principale: v.photos[0]?.id_photo ?? null,
        tarif_base_location: v.vehicule_location.tarif_base_location,
        tarif_par_jour_location: v.vehicule_location.tarif_par_jour_location,
      }));

      return res.status(200).json({ success: true, data, meta: { total, page, limit } });
    } catch (error) {
      console.error('[location.rechercherVehicules]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Détail public d'un véhicule de location (passager) ──────
  // GET /locations/vehicules/:id
  async detailVehicule(req, res) {
    try {
      const vehicule = await prisma.vehicule.findUnique({
        where: { id_vehicule: req.params.id },
        include: {
          vehicule_location: { include: { location: { include: { avis: true } } } },
          proprietaire: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
        },
      });

      if (!vehicule || vehicule.supprime_le || !vehicule.vehicule_location) {
        return res.status(404).json({ success: false, message: 'Véhicule de location introuvable.' });
      }

      const tousAvis = vehicule.vehicule_location.location.flatMap((l) => l.avis);

      const data = {
        id_vehicule: vehicule.id_vehicule,
        marque: vehicule.marque,
        modele: vehicule.modele,
        annee: vehicule.annee,
        couleur: vehicule.couleur,
        immatriculation: vehicule.immatriculation,
        nb_places: vehicule.nb_places,
        climatisation: vehicule.climatisation,
        gps_actif: vehicule.gps_actif,
        statut: vehicule.statut,
        tarif_base_location: vehicule.vehicule_location.tarif_base_location,
        tarif_par_jour_location: vehicule.vehicule_location.tarif_par_jour_location,
        note_moyenne: noteMoyenne(tousAvis),
        proprietaire: {
          nom: vehicule.proprietaire.utilisateur.nom,
          prenom: vehicule.proprietaire.utilisateur.prenom,
        },
      };

      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('[location.detailVehicule]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Créer une demande de location (passager connecté) ──────
  // POST /locations
  async creerDemande(req, res) {
    try {
      const { id_vehicule, date_debut, date_fin } = req.body;
      const id_passager = req.user.id_utilisateur;

      const debut = new Date(date_debut);
      const fin = new Date(date_fin);

      const vehicule = await prisma.vehicule.findUnique({
        where: { id_vehicule },
        include: { vehicule_location: true },
      });

      if (!vehicule || vehicule.supprime_le || !vehicule.vehicule_location) {
        return res.status(404).json({ success: false, message: 'Véhicule de location introuvable.' });
      }
      if (vehicule.statut !== 'disponible') {
        return res.status(409).json({ success: false, message: 'Ce véhicule n\'est pas disponible.' });
      }

      // Chevauchement avec une location déjà en attente ou active sur la même période
      const conflit = await prisma.location.findFirst({
        where: {
          id_vehicule,
          statut: { in: ['en_attente', 'active'] },
          date_debut: { lt: fin },
          date_fin: { gt: debut },
        }
      });
      if (conflit) {
        return res.status(409).json({ success: false, message: 'Ce véhicule est déjà réservé sur cette période.' });
      }

      const nbJours = Math.max(1, Math.ceil((fin - debut) / 86400000));
      const tarifBase = Number(vehicule.vehicule_location.tarif_base_location ?? 0);
      const tarifJour = Number(vehicule.vehicule_location.tarif_par_jour_location ?? 0);
      const montant_total = tarifBase + tarifJour * nbJours;

      const location = await prisma.$transaction(async (tx) => {
        const loc = await tx.location.create({
          data: {
            id_vehicule,
            id_passager,
            date_debut: debut,
            date_fin: fin,
            montant_total,
            statut: 'en_attente',
          }
        });
        await tx.notification.create({
          data: {
            id_utilisateur: vehicule.id_proprietaire,
            type: 'location_demande',
            titre: 'Nouvelle demande de location',
            contenu: `Une demande de location a été faite pour votre ${vehicule.marque} ${vehicule.modele}.`,
            id_objet_lie: loc.id_location,
          }
        });
        return loc;
      });

      return res.status(201).json({ success: true, data: location });
    } catch (error) {
      console.error('[location.creerDemande]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Mes locations (propriétaire connecté) ──────────────────
  // GET /locations/mes-locations?statut=en_attente|active|historique
  async mesLocations(req, res) {
    try {
      const ownerId = req.user.id_utilisateur;
      const { statut } = req.query;

      const statutIn = statut ? STATUT_GROUPS[statut] : undefined;
      if (statut && !statutIn) {
        return res.status(400).json({ success: false, message: 'Filtre statut invalide.' });
      }

      const locations = await prisma.location.findMany({
        where: {
          ...(statutIn ? { statut: { in: statutIn } } : {}),
          vehicule: { vehicule: { id_proprietaire: ownerId } },
        },
        include: {
          passager: {
            include: {
              utilisateur: {
                select: { nom: true, prenom: true, photo_profil: true, numero_telephone: true },
              },
            },
          },
          vehicule: {
            include: {
              vehicule: { select: { marque: true, modele: true, annee: true, immatriculation: true } },
            },
          },
          avis: { select: { note: true } },
          conversation: { select: { id_conversation: true } },
        },
        orderBy: { date_debut: 'desc' },
      });

      const data = locations.map((l) => ({
        id_location: l.id_location,
        statut: l.statut,
        date_debut: l.date_debut,
        date_fin: l.date_fin,
        montant_total: l.montant_total,
        vehicule: l.vehicule.vehicule,
        passager: {
          id_utilisateur: l.passager.id_passager,
          nom: l.passager.utilisateur.nom,
          prenom: l.passager.utilisateur.prenom,
          photo_profil: l.passager.utilisateur.photo_profil,
          numero_telephone: l.passager.utilisateur.numero_telephone,
        },
        note_moyenne: noteMoyenne(l.avis),
        id_conversation: l.conversation?.id_conversation ?? null,
      }));

      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('[location.mesLocations]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Mes demandes de location (passager connecté) ────────────
  // GET /locations/mes-demandes?statut=en_attente|active|historique
  async mesDemandes(req, res) {
    try {
      const idPassager = req.user.id_utilisateur;
      const { statut } = req.query;

      const statutIn = statut ? STATUT_GROUPS[statut] : undefined;
      if (statut && !statutIn) {
        return res.status(400).json({ success: false, message: 'Filtre statut invalide.' });
      }

      const locations = await prisma.location.findMany({
        where: {
          id_passager: idPassager,
          ...(statutIn ? { statut: { in: statutIn } } : {}),
        },
        include: {
          vehicule: {
            include: {
              vehicule: {
                select: {
                  marque: true,
                  modele: true,
                  annee: true,
                  immatriculation: true,
                  id_proprietaire: true,
                  proprietaire: {
                    include: {
                      utilisateur: { select: { nom: true, prenom: true, numero_telephone: true } },
                    },
                  },
                },
              },
            },
          },
          conversation: { select: { id_conversation: true } },
        },
        orderBy: { date_debut: 'desc' },
      });

      const data = locations.map((l) => {
        const veh = l.vehicule.vehicule;
        return {
          id_location: l.id_location,
          statut: l.statut,
          date_debut: l.date_debut,
          date_fin: l.date_fin,
          montant_total: l.montant_total,
          vehicule: { marque: veh.marque, modele: veh.modele, annee: veh.annee, immatriculation: veh.immatriculation },
          proprietaire: {
            id_utilisateur: veh.id_proprietaire,
            nom: veh.proprietaire.utilisateur.nom,
            prenom: veh.proprietaire.utilisateur.prenom,
            numero_telephone: veh.proprietaire.utilisateur.numero_telephone,
          },
          id_conversation: l.conversation?.id_conversation ?? null,
        };
      });

      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('[location.mesDemandes]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Détail d'une location ───────────────────────────────────
  // GET /locations/:id  (checkLocationOwnership a déjà validé l'accès, req.location est défini)
  async findOne(req, res) {
    try {
      const location = await prisma.location.findUnique({
        where: { id_location: req.params.id },
        include: {
          passager: {
            include: {
              utilisateur: {
                select: { nom: true, prenom: true, photo_profil: true, numero_telephone: true },
              },
            },
          },
          vehicule: { include: { vehicule: true } },
          avis: true,
          conversation: { select: { id_conversation: true } },
        },
      });

      // Aplati à la même forme que mesLocations() pour un modèle Flutter unique.
      const data = {
        id_location: location.id_location,
        statut: location.statut,
        date_debut: location.date_debut,
        date_fin: location.date_fin,
        montant_total: location.montant_total,
        vehicule: location.vehicule.vehicule,
        passager: {
          id_utilisateur: location.passager.id_passager,
          nom: location.passager.utilisateur.nom,
          prenom: location.passager.utilisateur.prenom,
          photo_profil: location.passager.utilisateur.photo_profil,
          numero_telephone: location.passager.utilisateur.numero_telephone,
        },
        note_moyenne: noteMoyenne(location.avis),
        id_conversation: location.conversation?.id_conversation ?? null,
      };

      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('[location.findOne]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Accepter une demande de location ────────────────────────
  // PATCH /locations/:id/accepter
  // Le propriétaire doit d'abord confirmer : c'est uniquement à cet instant
  // qu'une conversation (chat) est créée entre lui et le passager.
  async accepter(req, res) {
    try {
      if (req.location.statut !== 'en_attente') {
        return res.status(409).json({ success: false, message: 'Cette demande n\'est plus en attente.' });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Sérialise toutes les acceptations portant sur le même véhicule.
        // Le verrou précède la relecture, le contrôle de période et tout débit.
        const vehiculesVerrouilles = await tx.$queryRaw`
          SELECT "id_vehicule", "id_proprietaire"
          FROM "vehicule"
          WHERE "id_vehicule" = CAST(${req.location.id_vehicule} AS UUID)
          FOR UPDATE
        `;
        if (vehiculesVerrouilles.length === 0) {
          const introuvable = new Error('VEHICULE_INTROUVABLE');
          introuvable.code = 'VEHICULE_INTROUVABLE';
          throw introuvable;
        }

        const loc = await tx.location.findUnique({ where: { id_location: req.params.id } });
        if (!loc || loc.statut !== 'en_attente') {
          const conflit = new Error('LOCATION_STATUT_CONFLIT');
          conflit.code = 'LOCATION_STATUT_CONFLIT';
          throw conflit;
        }

        const locationConflictuelle = await tx.location.findFirst({
          where: {
            id_vehicule: loc.id_vehicule,
            id_location: { not: loc.id_location },
            statut: { in: STATUTS_LOCATION_BLOQUANTS },
            date_debut: { lt: loc.date_fin },
            date_fin: { gt: loc.date_debut },
          },
          select: { id_location: true },
        });
        if (locationConflictuelle) {
          const conflit = new Error('LOCATION_PERIODE_CONFLIT');
          conflit.code = 'LOCATION_PERIODE_CONFLIT';
          throw conflit;
        }

        const verrou = await tx.location.updateMany({
          where: { id_location: loc.id_location, statut: 'en_attente' },
          data: { statut: 'active' },
        });
        if (verrou.count === 0) {
          const conflit = new Error('LOCATION_STATUT_CONFLIT');
          conflit.code = 'LOCATION_STATUT_CONFLIT';
          throw conflit;
        }

        const idPassager = loc.id_passager;
        const idProprietaire = vehiculesVerrouilles[0].id_proprietaire;
        const montantTotal = parseFloat(loc.montant_total);
        const commission = parseFloat((montantTotal * LOCATION_COMMISSION_RATE).toFixed(2));
        const montantNet = parseFloat((montantTotal - commission).toFixed(2));

        const portefeuillePassager = await tx.portefeuille.findUnique({
          where: { id_utilisateur: idPassager },
        });
        if (!portefeuillePassager || portefeuillePassager.statut !== 'actif' || parseFloat(portefeuillePassager.solde) < montantTotal) {
          const erreurSolde = new Error('SOLDE_INSUFFISANT');
          erreurSolde.code = 'SOLDE_INSUFFISANT';
          throw erreurSolde;
        }

        await tx.vehicule.update({
          where: { id_vehicule: loc.id_vehicule },
          data: { statut: 'en_location' },
        });

        // Débit du locataire (anti double-débit : condition sur le solde dans le updateMany)
        const debit = await tx.portefeuille.updateMany({
          where: { id_utilisateur: idPassager, statut: 'actif', solde: { gte: montantTotal } },
          data: { solde: { decrement: montantTotal } },
        });
        if (debit.count === 0) {
          const erreurSolde = new Error('SOLDE_INSUFFISANT');
          erreurSolde.code = 'SOLDE_INSUFFISANT';
          throw erreurSolde;
        }
        const portefeuillePassagerApres = await tx.portefeuille.findUnique({
          where: { id_utilisateur: idPassager },
          select: { id_portefeuille: true, solde: true },
        });
        await tx.mouvement_portefeuille.create({
          data: {
            id_portefeuille: portefeuillePassagerApres.id_portefeuille,
            type_operation: 'LOCATION_VEHICULE',
            montant: montantTotal,
            sens: 'debit',
            solde_apres: portefeuillePassagerApres.solde,
            id_objet_lie: loc.id_location,
          },
        });

        // Crédit du propriétaire, net de la commission plateforme
        const portefeuilleProprietaireApres = await tx.portefeuille.update({
          where: { id_utilisateur: idProprietaire },
          data: { solde: { increment: montantNet } },
          select: { id_portefeuille: true, solde: true },
        });
        await tx.mouvement_portefeuille.create({
          data: {
            id_portefeuille: portefeuilleProprietaireApres.id_portefeuille,
            type_operation: 'LOCATION_VEHICULE',
            montant: montantNet,
            sens: 'credit',
            solde_apres: portefeuilleProprietaireApres.solde,
            id_objet_lie: loc.id_location,
          },
        });

        await tx.paiement.create({
          data: {
            id_utilisateur: idPassager,
            montant: montantTotal,
            methode: 'PORTEFEUILLE',
            statut: 'complete',
            type: 'LOCATION_VEHICULE',
            id_objet_lie: loc.id_location,
          },
        });

        const conversation = await tx.conversation.create({
          data: { id_location: loc.id_location },
        });
        await tx.conversation_participant.createMany({
          data: [
            { id_conversation: conversation.id_conversation, id_utilisateur: idPassager },
            { id_conversation: conversation.id_conversation, id_utilisateur: idProprietaire },
          ],
          skipDuplicates: true,
        });

        await tx.notification.create({
          data: {
            id_utilisateur: idPassager,
            type: 'location_acceptee',
            titre: 'Demande de location acceptée',
            contenu: 'Votre demande de location a été acceptée. Vous pouvez maintenant discuter avec le propriétaire.',
            id_objet_lie: loc.id_location,
          }
        });

        return {
          location: { ...loc, statut: 'active' },
          id_conversation: conversation.id_conversation,
          commission,
          montantNet,
        };
      });

      return res.status(200).json({
        success: true,
        data: {
          ...result.location,
          id_conversation: result.id_conversation,
          commission: result.commission,
          montant_net: result.montantNet,
        },
      });
    } catch (error) {
      if (error.code === 'LOCATION_STATUT_CONFLIT') {
        return res.status(409).json({ success: false, message: 'Cette demande n\'est plus en attente.', errors: { code: error.code } });
      }
      if (error.code === 'SOLDE_INSUFFISANT') {
        return res.status(402).json({ success: false, message: 'Le solde du portefeuille du locataire est insuffisant pour cette location.', errors: { code: error.code } });
      }
      if (error.code === 'LOCATION_PERIODE_CONFLIT') {
        return res.status(409).json({
          success: false,
          message: 'Ce véhicule est déjà réservé sur cette période.',
          data: null,
          errors: { code: error.code },
        });
      }
      if (error.code === 'VEHICULE_INTROUVABLE') {
        return res.status(404).json({ success: false, message: 'Véhicule introuvable.', data: null, errors: { code: error.code } });
      }
      console.error('[location.accepter]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Refuser une demande de location ─────────────────────────
  // PATCH /locations/:id/refuser
  async refuser(req, res) {
    try {
      if (req.location.statut !== 'en_attente') {
        return res.status(409).json({ success: false, message: 'Cette demande n\'est plus en attente.' });
      }

      const location = await prisma.$transaction(async (tx) => {
        const verrou = await tx.location.updateMany({
          where: { id_location: req.params.id, statut: 'en_attente' },
          data: { statut: 'refusee' },
        });
        if (verrou.count === 0) {
          const conflit = new Error('LOCATION_STATUT_CONFLIT');
          conflit.code = 'LOCATION_STATUT_CONFLIT';
          throw conflit;
        }
        const loc = await tx.location.findUnique({ where: { id_location: req.params.id } });
        await tx.notification.create({
          data: {
            id_utilisateur: req.location.passager.id_passager,
            type: 'location_refusee',
            titre: 'Demande de location refusée',
            contenu: 'Votre demande de location a été refusée par le propriétaire.',
            id_objet_lie: loc.id_location,
          }
        });
        return loc;
      });

      return res.status(200).json({ success: true, data: location });
    } catch (error) {
      if (error.code === 'LOCATION_STATUT_CONFLIT') {
        return res.status(409).json({ success: false, message: 'Cette demande n\'est plus en attente.', errors: { code: error.code } });
      }
      console.error('[location.refuser]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Terminer une location active (propriétaire connecté) ────
  // PATCH /locations/:id/terminer — déclenché par le propriétaire, qui
  // récupère physiquement le véhicule (même convention que
  // trajetController.terminer, déclenché par le chauffeur).
  async terminer(req, res) {
    try {
      if (req.location.statut !== 'active') {
        return res.status(409).json({ success: false, message: 'Cette location n\'est pas active.' });
      }

      const location = await prisma.$transaction(async (tx) => {
        const verrou = await tx.location.updateMany({
          where: { id_location: req.params.id, statut: 'active' },
          data: { statut: 'terminee' },
        });
        if (verrou.count === 0) {
          const conflit = new Error('LOCATION_STATUT_CONFLIT');
          conflit.code = 'LOCATION_STATUT_CONFLIT';
          throw conflit;
        }
        const loc = await tx.location.findUnique({ where: { id_location: req.params.id } });
        await tx.vehicule.update({
          where: { id_vehicule: req.location.id_vehicule },
          data: { statut: 'disponible' },
        });
        await tx.notification.create({
          data: {
            id_utilisateur: req.location.passager.id_passager,
            type: 'location_terminee',
            titre: 'Location terminée',
            contenu: 'Votre location est terminée. Vous pouvez maintenant noter le propriétaire.',
            id_objet_lie: loc.id_location,
          }
        });
        return loc;
      });

      return res.status(200).json({ success: true, data: location });
    } catch (error) {
      if (error.code === 'LOCATION_STATUT_CONFLIT') {
        return res.status(409).json({ success: false, message: 'Cette location n\'est pas active.', errors: { code: error.code } });
      }
      console.error('[location.terminer]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Annuler une demande de location (passager connecté) ─────
  // PATCH /locations/:id/annuler
  async annuler(req, res) {
    try {
      if (req.location.id_passager !== req.user.id_utilisateur) {
        return res.status(403).json({ success: false, message: 'Seul le passager peut annuler sa demande.' });
      }
      if (req.location.statut !== 'en_attente') {
        return res.status(409).json({ success: false, message: 'Cette demande ne peut plus être annulée.' });
      }

      const idProprietaire = req.location.vehicule.vehicule.id_proprietaire;

      const location = await prisma.$transaction(async (tx) => {
        const verrou = await tx.location.updateMany({
          where: { id_location: req.params.id, statut: 'en_attente' },
          data: { statut: 'annulee' },
        });
        if (verrou.count === 0) {
          const conflit = new Error('LOCATION_STATUT_CONFLIT');
          conflit.code = 'LOCATION_STATUT_CONFLIT';
          throw conflit;
        }
        const loc = await tx.location.findUnique({ where: { id_location: req.params.id } });
        await tx.notification.create({
          data: {
            id_utilisateur: idProprietaire,
            type: 'location_annulee',
            titre: 'Demande de location annulée',
            contenu: 'Le passager a annulé sa demande de location.',
            id_objet_lie: loc.id_location,
          }
        });
        return loc;
      });

      return res.status(200).json({ success: true, data: location });
    } catch (error) {
      if (error.code === 'LOCATION_STATUT_CONFLIT') {
        return res.status(409).json({ success: false, message: 'Cette demande ne peut plus être annulée.', errors: { code: error.code } });
      }
      console.error('[location.annuler]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },
};

module.exports = LocationController;
