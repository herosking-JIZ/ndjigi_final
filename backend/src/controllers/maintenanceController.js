/**
 * MAINTENANCE CONTROLLER — Gestion des demandes de maintenance
 */

const { prisma } = require('../config/db');

const MaintenanceController = {
  // ── Créer une demande de maintenance ───────────────────────
  async creerDemande(req, res) {
    try {
      const { parkingId } = req.params;
      const {
        id_vehicule,
        type,
        urgence = 'normale',
        description
      } = req.body;

      const id_gestionnaire = req.user.id_utilisateur;

      if (!id_vehicule || !type || !description) {
        return res.status(400).json({
          success: false,
          message: 'id_vehicule, type, description requis.'
        });
      }

      const maintenance = await prisma.$transaction(async (tx) => {
        // Créer la demande
        const demande = await tx.maintenance.create({
          data: {
            id_vehicule,
            id_parking: parkingId,
            id_gestionnaire,
            type,
            urgence,
            description,
            statut: 'en_attente'
          },
          include: {
            vehicule: { select: { immatriculation: true, marque: true } }
          }
        });

        // Créer l'étape initiale de l'historique
        await tx.maintenance_step.create({
          data: {
            id_maintenance: demande.id_maintenance,
            statut_nouveau: 'en_attente',
            commentaire: 'Demande créée'
          }
        });

        // Notifier les admins
        const admins = await tx.utilisateur_role.findMany({
          where: { role: 'admin', actif: true },
          select: { id_utilisateur: true }
        });

        if (admins.length > 0) {
          await tx.notification.createMany({
            data: admins.map(a => ({
              id_utilisateur: a.id_utilisateur,
              type: 'maintenance',
              titre: `Nouvelle demande maintenance: ${demande.vehicule.immatriculation}`,
              contenu: `${demande.vehicule.marque} - Urgence: ${demande.urgence}`,
              id_objet_lie: demande.id_maintenance
            }))
          });
        }

        return demande;
      });

      return res.status(201).json({
        success: true,
        message: 'Demande de maintenance créée.',
        data: {
          id_maintenance: maintenance.id_maintenance,
          immatriculation: maintenance.vehicule.immatriculation,
          statut: maintenance.statut,
          urgence: maintenance.urgence
        }
      });
    } catch (error) {
      console.error('[maintenance.creerDemande]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Lister les demandes de maintenance ──────────────────────
  async listerDemandes(req, res) {
    try {
      const { parkingId } = req.params;
      const { page = 1, limit = 20, statut, urgence } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const where = { id_parking: parkingId };

      if (statut) where.statut = statut;
      if (urgence) where.urgence = urgence;

      const [demandes, total] = await Promise.all([
        prisma.maintenance.findMany({
          where,
          orderBy: { date_creation: 'desc' },
          skip,
          take: parseInt(limit),
          include: {
            vehicule: { select: { immatriculation: true, marque: true } },
            gestionnaire: { select: { nom: true, prenom: true } }
          }
        }),
        prisma.maintenance.count({ where })
      ]);

      const data = demandes.map(d => ({
        id_maintenance: d.id_maintenance,
        immatriculation: d.vehicule.immatriculation,
        marque: d.vehicule.marque,
        type: d.type,
        statut: d.statut,
        urgence: d.urgence,
        description: d.description,
        date_creation: d.date_creation,
        gestionnaire_nom: `${d.gestionnaire.prenom} ${d.gestionnaire.nom}`
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
      console.error('[maintenance.listerDemandes]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Obtenir détail d'une demande ───────────────────────────
  async obtenirDemande(req, res) {
    try {
      const { parkingId, maintenanceId } = req.params;

      const demande = await prisma.maintenance.findFirst({
        where: {
          id_maintenance: maintenanceId,
          id_parking: parkingId
        },
        include: {
          vehicule: { select: { immatriculation: true, marque: true, modele: true } },
          gestionnaire: { select: { nom: true, prenom: true, email: true } },
          historique: {
            orderBy: { date_transition: 'asc' },
            select: {
              id_step: true,
              statut_ancien: true,
              statut_nouveau: true,
              commentaire: true,
              date_transition: true
            }
          },
          photos: {
            select: {
              id_photo: true,
              fileKey: true,
              uploadedAt: true
            }
          }
        }
      });

      if (!demande) {
        return res.status(404).json({ success: false, message: 'Maintenance introuvable.' });
      }

      return res.status(200).json({ success: true, data: demande });
    } catch (error) {
      console.error('[maintenance.obtenirDemande]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Mettre à jour le statut ────────────────────────────────
  async mettreAJourStatut(req, res) {
    try {
      const { parkingId, maintenanceId } = req.params;
      const { statut, commentaire } = req.body;

      if (!statut) {
        return res.status(400).json({ success: false, message: 'statut requis.' });
      }

      const demande = await prisma.maintenance.findFirst({
        where: {
          id_maintenance: maintenanceId,
          id_parking: parkingId
        }
      });

      if (!demande) {
        return res.status(404).json({ success: false, message: 'Maintenance introuvable.' });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Mettre à jour le statut
        const updated = await tx.maintenance.update({
          where: { id_maintenance: maintenanceId },
          data: { statut }
        });

        // Créer l'étape de l'historique
        await tx.maintenance_step.create({
          data: {
            id_maintenance: maintenanceId,
            statut_ancien: demande.statut,
            statut_nouveau: statut,
            commentaire: commentaire || null
          }
        });

        return updated;
      });

      return res.status(200).json({
        success: true,
        message: 'Statut mis à jour.',
        data: { statut: result.statut }
      });
    } catch (error) {
      console.error('[maintenance.mettreAJourStatut]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  }
};

module.exports = MaintenanceController;
