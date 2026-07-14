/**
 * CONTROLLERS/CHAUFFEURCONTROLLER.JS
 */

const { prisma } = require('../config/db');
const { enregistrerPosition } = require('../services/tracking.service');

const ChauffeurController = {

  // ── Lister tous les chauffeurs ──────────────────────────────
  async lister(req, res) {
    try {
      const { statut_validation, statut_disponibilite, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {};
      if (statut_validation)   where.statut_validation   = statut_validation;
      if (statut_disponibilite) where.statut_disponibilite = statut_disponibilite;

      const [chauffeurs, total] = await Promise.all([
        prisma.chauffeur.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: {
            utilisateur: {
              select: {
                id_utilisateur: true,
                nom: true,
                prenom: true,
                email: true,
                numero_telephone: true,
                photo_profil: true,
                statut_compte: true,
                supprime_le: true,
              }
            },
            affectation_vehicule: {
              where: { est_active: true },
              include: { vehicule_course: { include: { vehicule: true } } }
            }
          }
        }),
        prisma.chauffeur.count({ where })
      ]);

      return res.status(200).json({
        success: true,
        data: chauffeurs,
        meta: { total, page: parseInt(page), limit: parseInt(limit) }
      });
    } catch (error) {
      console.error('[chauffeur.lister]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Récupérer un chauffeur ──────────────────────────────────
  async findOne(req, res) {
    try {
      const { id } = req.params;

      const chauffeur = await prisma.chauffeur.findUnique({
        where: { id_chauffeur: id },
        include: {
          utilisateur: {
            select: {
              id_utilisateur: true,
              nom: true,
              prenom: true,
              email: true,
              numero_telephone: true,
              photo_profil: true,
              adresse: true,
              statut_compte: true,
            }
          },
          affectation_vehicule: {
            include: { vehicule_course: { include: { vehicule: true } } }
          }
        }
      });

      if (!chauffeur) {
        return res.status(404).json({ success: false, message: 'Chauffeur introuvable.' });
      }

      return res.status(200).json({ success: true, data: chauffeur });
    } catch (error) {
      console.error('[chauffeur.findOne]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Mettre à jour un chauffeur ──────────────────────────────
  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        type_service,
        numero_permis,
        date_expiration_permis,
      } = req.body;

      const chauffeur = await prisma.chauffeur.update({
        where: { id_chauffeur: id },
        data: {
          ...(type_service            && { type_service }),
          ...(numero_permis           && { numero_permis }),
          ...(date_expiration_permis  && { date_expiration_permis: new Date(date_expiration_permis) }),
        }
      });

      return res.status(200).json({ success: true, data: chauffeur });
    } catch (error) {
      console.error('[chauffeur.update]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Valider / Rejeter un chauffeur (admin) ──────────────────
  async valider(req, res) {
    try {
      const { id } = req.params;
      const { statut_validation } = req.body;

      if (!['valide', 'rejete', 'en_attente'].includes(statut_validation)) {
        return res.status(400).json({ success: false, message: 'Statut invalide.' });
      }

      const chauffeur = await prisma.chauffeur.update({
        where: { id_chauffeur: id },
        data: { statut_validation }
      });

      return res.status(200).json({ success: true, data: chauffeur });
    } catch (error) {
      console.error('[chauffeur.valider]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Changer la disponibilité ────────────────────────────────
  async changerDisponibilite(req, res) {
    try {
      const { statut_disponibilite } = req.body;
      const id = req.user.id_utilisateur;

      if (!['en_ligne', 'hors_ligne', 'en_course'].includes(statut_disponibilite)) {
        return res.status(400).json({ success: false, message: 'Statut invalide.' });
      }

      const chauffeur = await prisma.chauffeur.update({
        where: { id_chauffeur: id },
        data: { statut_disponibilite }
      });

      return res.status(200).json({ success: true, data: chauffeur });
    } catch (error) {
      console.error('[chauffeur.changerDisponibilite]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Suspendre un chauffeur (admin) ──────────────────────────
  async suspendre(req, res) {
    try {
      const { id } = req.params;

      const chauffeur = await prisma.chauffeur.update({
        where: { id_chauffeur: id },
        data: {
          statut_disponibilite:    'hors_ligne',
          date_derniere_suspension: new Date(),
        }
      });

      return res.status(200).json({ success: true, data: chauffeur });
    } catch (error) {
      console.error('[chauffeur.suspendre]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Statistiques d'un chauffeur ─────────────────────────────
  async statistiques(req, res) {
    try {
      const { id } = req.params;

      const chauffeur = await prisma.chauffeur.findUnique({
        where: { id_chauffeur: id },
        select: {
          note_chauffeur:        true,
          nb_courses_effectuees: true,
          solde_commission_du:   true,
          affectation_vehicule: {
            where: { est_active: true },
            select: { vehicule_course: { select: { vehicule: { select: { marque: true, modele: true, immatriculation: true } } } } }
          }
        }
      });

      if (!chauffeur) {
        return res.status(404).json({ success: false, message: 'Chauffeur introuvable.' });
      }

      return res.status(200).json({ success: true, data: chauffeur });
    } catch (error) {
      console.error('[chauffeur.statistiques]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Envoyer sa position GPS ──────────────────────────────────
  async envoyerMaPosition(req, res) {
    try {
      const { latitude, longitude, vitesse, cap } = req.body;
      const id_chauffeur = req.user.id_utilisateur;

      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Latitude et longitude requises.',
          errors: { code: 'INVALID_POSITION' }
        });
      }

      const affectation = await prisma.affectation_vehicule.findFirst({
        where: { id_chauffeur, est_active: true },
        select: { id_vehicule: true }
      });

      if (!affectation) {
        return res.status(404).json({
          success: false,
          message: 'Aucun véhicule affecté.',
          errors: { code: 'NO_ACTIVE_VEHICLE' }
        });
      }

      await enregistrerPosition(affectation.id_vehicule, { latitude, longitude, vitesse, cap });

      return res.status(200).json({
        success: true,
        message: 'Position enregistrée.'
      });
    } catch (error) {
      console.error('[chauffeur.envoyerMaPosition]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        errors: { code: 'INTERNAL_ERROR', details: error.message }
      });
    }
  },
};

module.exports = ChauffeurController;
