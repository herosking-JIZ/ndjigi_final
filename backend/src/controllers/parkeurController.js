/**
 * PARKEUR CONTROLLER — Gestion des mouvements parking (entrée/sortie)
 */

const { prisma } = require('../config/db');

const ParkeurController = {
  // ── Détail parking pour le gestionnaire ────────────────────
  async detailParking(req, res) {
    try {
      const { parkingId } = req.params;

      const parking = await prisma.parking.findUnique({
        where: { id_parking: parkingId },
        include: {
          gestionnaire_parking: {
            include: {
              utilisateur: { select: { nom: true, prenom: true, email: true } }
            }
          }
        }
      });

      if (!parking) {
        return res.status(404).json({ success: false, message: 'Parking introuvable.' });
      }

      // Calculer véhicules en bon état
      const vehiculesBonEtat = await prisma.vehicule.count({
        where: {
          id_parking: parkingId,
          supprime_le: null,
          journal_parking: {
            none: {
              type_mouvement: 'entree',
              etat_vehicule: { not: 'bon_etat' }
            }
          }
        }
      });

      return res.status(200).json({
        success: true,
        data: {
          ...parking,
          capacite_dispo: (parking.capacite_totale || 0) - parking.capacite_occupee,
          vehicules_bon_etat: vehiculesBonEtat
        }
      });
    } catch (error) {
      console.error('[parkeur.detailParking]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Véhicules garés dans le parking ────────────────────────
  async vehiculesGares(req, res) {
    try {
      const { parkingId } = req.params;

      const vehicules = await prisma.vehicule.findMany({
        where: {
          id_parking: parkingId,
          supprime_le: null
        },
        include: {
          proprietaire: {
            include: {
              utilisateur: { select: { nom: true, prenom: true } }
            }
          },
          journal_parking: {
            orderBy: { date_mouvement: 'desc' },
            take: 1,
            select: { etat_vehicule: true, type_mouvement: true }
          }
        }
      });

      const data = vehicules.map(v => ({
        id_vehicule: v.id_vehicule,
        immatriculation: v.immatriculation,
        marque: v.marque,
        modele: v.modele,
        categorie: v.categorie_vehicule?.nom || 'N/A',
        proprietaire_nom: `${v.proprietaire.utilisateur.prenom} ${v.proprietaire.utilisateur.nom}`,
        statut: v.statut,
        etat: v.journal_parking[0]?.etat_vehicule || 'bon_etat'
      }));

      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('[parkeur.vehiculesGares]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Mouvements pour ce parking ─────────────────────────────
  async mouvementsParkeur(req, res) {
    try {
      const { parkingId } = req.params;
      const { page = 1, limit = 20, search } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const where = { id_parking: parkingId };

      if (search && search.trim() !== '') {
        where.OR = [
          { vehicule: { immatriculation: { contains: search, mode: 'insensitive' } } },
          { utilisateur: { nom: { contains: search, mode: 'insensitive' } } },
          { utilisateur: { prenom: { contains: search, mode: 'insensitive' } } }
        ];
      }

      const [mouvements, total] = await Promise.all([
        prisma.journal_parking.findMany({
          where,
          orderBy: { date_mouvement: 'desc' },
          skip,
          take: parseInt(limit),
          include: {
            vehicule: { select: { immatriculation: true } },
            utilisateur: { select: { nom: true, prenom: true } }
          }
        }),
        prisma.journal_parking.count({ where })
      ]);

      const data = mouvements.map(m => ({
        id_log: m.id_log,
        id_vehicule: m.id_vehicule,
        immatriculation: m.vehicule.immatriculation,
        id_parking: m.id_parking,
        parkeur_nom: `${m.utilisateur.prenom} ${m.utilisateur.nom}`,
        type_mouvement: m.type_mouvement,
        etat_vehicule: m.etat_vehicule,
        date_mouvement: m.date_mouvement,
        commentaire: m.commentaire
      }));

      return res.status(200).json({
        success: true,
        message: 'Opération réussie',
        data: {
          data,
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        },
        errors: null
      });
    } catch (error) {
      console.error('[parkeur.mouvementsParkeur]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Enregistrer une entrée ─────────────────────────────────
  async enregistrerEntree(req, res) {
    try {
      const { parkingId } = req.params;
      const {
        id_vehicule,
        id_utilisateur,
        etat_vehicule,
        commentaire
      } = req.body;

      if (!id_vehicule || !id_utilisateur || !etat_vehicule) {
        return res.status(400).json({
          success: false,
          message: 'id_vehicule, id_utilisateur, etat_vehicule requis.'
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Créer le mouvement
        const mouvement = await tx.journal_parking.create({
          data: {
            id_vehicule,
            id_parking: parkingId,
            id_utilisateur,
            type_mouvement: 'entree',
            etat_vehicule,
            commentaire: commentaire || null,
            besoin_maintenance: etat_vehicule !== 'bon_etat'
          },
          include: {
            vehicule: { select: { immatriculation: true } }
          }
        });

        // Mettre à jour la capacité
        await tx.parking.update({
          where: { id_parking: parkingId },
          data: { capacite_occupee: { increment: 1 } }
        });

        return mouvement;
      });

      return res.status(201).json({
        success: true,
        message: 'Entrée enregistrée.',
        data: {
          id_log: result.id_log,
          id_vehicule: result.id_vehicule,
          immatriculation: result.vehicule.immatriculation,
          etat_vehicule: result.etat_vehicule,
          besoin_maintenance: result.besoin_maintenance
        }
      });
    } catch (error) {
      console.error('[parkeur.enregistrerEntree]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Enregistrer une sortie ────────────────────────────────
  async enregistrerSortie(req, res) {
    try {
      const { parkingId } = req.params;
      const {
        id_vehicule,
        id_utilisateur,
        etat_vehicule,
        commentaire
      } = req.body;

      if (!id_vehicule || !id_utilisateur || !etat_vehicule) {
        return res.status(400).json({
          success: false,
          message: 'id_vehicule, id_utilisateur, etat_vehicule requis.'
        });
      }

      // Trouver l'entrée précédente pour calculer le temps
      const entree = await prisma.journal_parking.findFirst({
        where: {
          id_vehicule,
          id_parking: parkingId,
          type_mouvement: 'entree'
        },
        orderBy: { date_mouvement: 'desc' },
        select: { date_mouvement: true }
      });

      const temps_stationnement = entree
        ? Math.floor((new Date() - new Date(entree.date_mouvement)) / 1000)
        : 0;

      const result = await prisma.$transaction(async (tx) => {
        // Créer le mouvement
        const mouvement = await tx.journal_parking.create({
          data: {
            id_vehicule,
            id_parking: parkingId,
            id_utilisateur,
            type_mouvement: 'sortie',
            etat_vehicule,
            commentaire: commentaire || null,
            besoin_maintenance: etat_vehicule !== 'bon_etat'
          },
          include: {
            vehicule: { select: { immatriculation: true } }
          }
        });

        // Mettre à jour la capacité
        await tx.parking.update({
          where: { id_parking: parkingId },
          data: { capacite_occupee: { decrement: 1 } }
        });

        return mouvement;
      });

      return res.status(201).json({
        success: true,
        message: 'Sortie enregistrée.',
        data: {
          id_log: result.id_log,
          id_vehicule: result.id_vehicule,
          immatriculation: result.vehicule.immatriculation,
          etat_vehicule: result.etat_vehicule,
          temps_stationnement // en secondes
        }
      });
    } catch (error) {
      console.error('[parkeur.enregistrerSortie]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  }
};

module.exports = ParkeurController;
