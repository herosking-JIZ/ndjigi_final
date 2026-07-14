/**
 * CONTROLLERS/AFFECTATIONCONTROLLER.JS
 */

const { prisma } = require('../config/db');

const AffectationController = {

  // ── Assigner un véhicule à un chauffeur ─────────────────────
  async assigner(req, res) {
    try {
      const { id_vehicule, id_chauffeur, date_debut } = req.body;

      if (!id_vehicule || !id_chauffeur) {
        return res.status(400).json({ success: false, message: 'id_vehicule et id_chauffeur requis.' });
      }

      // Vérifier que le véhicule n'est pas déjà affecté activement
      const affectationActive = await prisma.affectation_vehicule.findFirst({
        where: { id_vehicule, est_active: true }
      });

      if (affectationActive) {
        return res.status(409).json({
          success: false,
          message: 'Ce véhicule est déjà affecté à un chauffeur actif.'
        });
      }

      const affectation = await prisma.affectation_vehicule.create({
        data: {
          id_vehicule,
          id_chauffeur,
          date_debut: date_debut ? new Date(date_debut) : new Date(),
          est_active: true,
        },
        include: {
          vehicule_course: { include: { vehicule: true } },
          chauffeur: {
            include: {
              utilisateur: { select: { nom: true, prenom: true } }
            }
          }
        }
      });

      return res.status(201).json({ success: true, data: affectation });
    } catch (error) {
      console.error('[affectation.assigner]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Terminer une affectation ────────────────────────────────
  async terminer(req, res) {
    try {
      const { id } = req.params;
      const { motif_fin } = req.body;

      const affectation = await prisma.affectation_vehicule.update({
        where: { id_affectation: id },
        data: {
          est_active: false,
          date_fin:   new Date(),
          motif_fin:  motif_fin ?? null,
        }
      });

      return res.status(200).json({ success: true, data: affectation });
    } catch (error) {
      console.error('[affectation.terminer]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Historique des affectations d'un véhicule ───────────────
  async historique(req, res) {
    try {
      const { id_vehicule } = req.params;

      const affectations = await prisma.affectation_vehicule.findMany({
        where: { id_vehicule },
        orderBy: { date_debut: 'desc' },
        include: {
          chauffeur: {
            include: {
              utilisateur: {
                select: { nom: true, prenom: true, photo_profil: true }
              }
            }
          }
        }
      });

      return res.status(200).json({ success: true, data: affectations });
    } catch (error) {
      console.error('[affectation.historique]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Affectation active d'un chauffeur ───────────────────────
  async affectationChauffeur(req, res) {
    try {
      const { id_chauffeur } = req.params;

      const affectation = await prisma.affectation_vehicule.findFirst({
        where: { id_chauffeur, est_active: true },
        include: { vehicule_course: { include: { vehicule: true } } }
      });

      return res.status(200).json({ success: true, data: affectation ?? null });
    } catch (error) {
      console.error('[affectation.affectationChauffeur]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },
};

module.exports = AffectationController;
