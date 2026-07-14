/**
 * CONTROLLERS/PROPRIETAIRECONTROLLER.JS
 */

const { prisma } = require('../config/db');

const ProprietaireController = {

  // ── Lister tous les propriétaires ──────────────────────────
  async lister(req, res) {
    try {
      const { statut_validation, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {};
      if (statut_validation) where.statut_validation = statut_validation;

      const [proprietaires, total] = await Promise.all([
        prisma.proprietaire.findMany({
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
              }
            },
            vehicule: {
              select: {
                id_vehicule: true,
                marque: true,
                modele: true,
                immatriculation: true,
                statut: true,
              }
            }
          }
        }),
        prisma.proprietaire.count({ where })
      ]);

      return res.status(200).json({
        success: true,
        data: proprietaires,
        meta: { total, page: parseInt(page), limit: parseInt(limit) }
      });
    } catch (error) {
      console.error('[proprietaire.lister]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Récupérer un propriétaire ───────────────────────────────
  async findOne(req, res) {
    try {
      const { id } = req.params;

      const rolesUser = req.user.utilisateur_role.map(r => r.role);
      if (!rolesUser.includes('admin') && id !== req.user.id_utilisateur) {
        return res.status(403).json({ success: false, message: 'Accès refusé.' });
      }

      const proprietaire = await prisma.proprietaire.findUnique({
        where: { id_proprietaire: id },
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
            }
          },
          vehicule: true
        }
      });

      if (!proprietaire) {
        return res.status(404).json({ success: false, message: 'Propriétaire introuvable.' });
      }

      return res.status(200).json({ success: true, data: proprietaire });
    } catch (error) {
      console.error('[proprietaire.findOne]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Valider un propriétaire (admin) ────────────────────────
  async valider(req, res) {
    try {
      const { id } = req.params;
      const { statut_validation } = req.body;

      if (!['valide', 'rejete', 'en_attente'].includes(statut_validation)) {
        return res.status(400).json({ success: false, message: 'Statut invalide.' });
      }

      const proprietaire = await prisma.proprietaire.update({
        where: { id_proprietaire: id },
        data: { statut_validation }
      });

      return res.status(200).json({ success: true, data: proprietaire });
    } catch (error) {
      console.error('[proprietaire.valider]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Mes véhicules (propriétaire connecté) ──────────────────
  async mesVehicules(req, res) {
    try {
      const id = req.user.id_utilisateur;

      const vehicules = await prisma.vehicule.findMany({
        where: {
          id_proprietaire: id,
          supprime_le: null,
        },
        include: {
          // affectation_vehicule appartient à vehicule_course (véhicule VTC), pas
          // directement au supertype vehicule — un véhicule de location pure n'a
          // donc pas d'affectation (vehicule_course sera null).
          vehicule_course: {
            include: {
              affectation_vehicule: {
                where: { est_active: true },
                include: {
                  chauffeur: {
                    include: {
                      utilisateur: {
                        select: { nom: true, prenom: true, photo_profil: true }
                      }
                    }
                  }
                }
              }
            }
          },
          vehicule_location: true,
          photos: {
            where: { is_principale: true, deletedAt: null },
            take: 1,
          },
        }
      });

      return res.status(200).json({ success: true, data: vehicules });
    } catch (error) {
      console.error('[proprietaire.mesVehicules]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Statistiques propriétaire ───────────────────────────────
  async statistiques(req, res) {
    try {
      const { id } = req.params;

      const rolesUser = req.user.utilisateur_role.map(r => r.role);
      if (!rolesUser.includes('admin') && id !== req.user.id_utilisateur) {
        return res.status(403).json({ success: false, message: 'Accès refusé.' });
      }

      const proprietaire = await prisma.proprietaire.findUnique({
        where: { id_proprietaire: id },
        select: {
          note_proprietaire:       true,
          nb_locations_effectuees: true,
          vehicule: {
            select: {
              id_vehicule: true,
              statut: true,
              marque: true,
              modele: true,
            }
          }
        }
      });

      if (!proprietaire) {
        return res.status(404).json({ success: false, message: 'Propriétaire introuvable.' });
      }

      return res.status(200).json({ success: true, data: proprietaire });
    } catch (error) {
      console.error('[proprietaire.statistiques]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },
};

module.exports = ProprietaireController;
