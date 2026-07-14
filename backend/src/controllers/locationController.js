/**
 * CONTROLLERS/LOCATIONCONTROLLER.JS
 *
 * Gère les locations de véhicules (location courte durée) côté propriétaire :
 * liste de ses locations, détail, accepter/refuser une demande.
 *
 * Convention des statuts (colonne `statut` en VarChar libre, pas d'enum Prisma) :
 *   en_attente | active | terminee | annulee | refusee
 * "Historique" (Flutter) = terminee | annulee | refusee
 */

const { prisma } = require('../config/db');

const STATUT_GROUPS = {
  en_attente: ['en_attente'],
  active: ['active'],
  historique: ['terminee', 'annulee', 'refusee'],
};

const LocationController = {

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

      const location = await prisma.location.create({
        data: {
          id_vehicule,
          id_passager,
          date_debut: debut,
          date_fin: fin,
          montant_total,
          statut: 'en_attente',
        }
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
          nom: l.passager.utilisateur.nom,
          prenom: l.passager.utilisateur.prenom,
          photo_profil: l.passager.utilisateur.photo_profil,
          numero_telephone: l.passager.utilisateur.numero_telephone,
        },
        note_moyenne: l.avis.length
          ? l.avis.reduce((somme, a) => somme + (a.note ?? 0), 0) / l.avis.length
          : null,
      }));

      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('[location.mesLocations]', error);
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
          nom: location.passager.utilisateur.nom,
          prenom: location.passager.utilisateur.prenom,
          photo_profil: location.passager.utilisateur.photo_profil,
          numero_telephone: location.passager.utilisateur.numero_telephone,
        },
        note_moyenne: location.avis.length
          ? location.avis.reduce((somme, a) => somme + (a.note ?? 0), 0) / location.avis.length
          : null,
      };

      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('[location.findOne]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Accepter une demande de location ────────────────────────
  // PATCH /locations/:id/accepter
  async accepter(req, res) {
    try {
      if (req.location.statut !== 'en_attente') {
        return res.status(409).json({ success: false, message: 'Cette demande n\'est plus en attente.' });
      }

      const location = await prisma.$transaction(async (tx) => {
        const loc = await tx.location.update({
          where: { id_location: req.params.id },
          data: { statut: 'active' },
        });
        await tx.vehicule.update({
          where: { id_vehicule: req.location.id_vehicule },
          data: { statut: 'en_location' },
        });
        return loc;
      });

      return res.status(200).json({ success: true, data: location });
    } catch (error) {
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

      const location = await prisma.location.update({
        where: { id_location: req.params.id },
        data: { statut: 'refusee' },
      });

      return res.status(200).json({ success: true, data: location });
    } catch (error) {
      console.error('[location.refuser]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },
};

module.exports = LocationController;
