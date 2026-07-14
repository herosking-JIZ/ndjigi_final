/**
 * CONTROLLERS/PASSAGERCONTROLLER.JS
 */

const { prisma } = require('../config/db');

const PassagerController = {

  // ── Lister tous les passagers ───────────────────────────────
  async lister(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [passagers, total] = await Promise.all([
        prisma.passager.findMany({
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
            }
          }
        }),
        prisma.passager.count()
      ]);

      return res.status(200).json({
        success: true,
        data: passagers,
        meta: { total, page: parseInt(page), limit: parseInt(limit) }
      });
    } catch (error) {
      console.error('[passager.lister]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Récupérer un passager ───────────────────────────────────
  async findOne(req, res) {
    try {
      const { id } = req.params;

      const passager = await prisma.passager.findUnique({
        where: { id_passager: id },
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
          reservation: {
            orderBy: { date_reservation: 'desc' },
            take: 5,
            include: { trajet: true }
          }
        }
      });

      if (!passager) {
        return res.status(404).json({ success: false, message: 'Passager introuvable.' });
      }

      return res.status(200).json({ success: true, data: passager });
    } catch (error) {
      console.error('[passager.findOne]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Mettre à jour adresses favorites ───────────────────────
  async updateAdresses(req, res) {
    try {
      const id = req.user.id_utilisateur;
      const { adresses_favorites } = req.body;

      if (!Array.isArray(adresses_favorites)) {
        return res.status(400).json({ success: false, message: 'Format invalide.' });
      }

      const passager = await prisma.passager.update({
        where: { id_passager: id },
        data: { adresses_favorites }
      });

      return res.status(200).json({ success: true, data: passager });
    } catch (error) {
      console.error('[passager.updateAdresses]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Historique des courses ──────────────────────────────────
  async historique(req, res) {
    try {
      const id = req.user.id_utilisateur;
      const { page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const reservations = await prisma.reservation.findMany({
        where: { id_passager: id },
        skip,
        take: parseInt(limit),
        orderBy: { date_reservation: 'desc' },
        include: {
          trajet: {
            include: {
              zone_tarifaire: true,
              affectation_vehicule: {
                include: {
                  chauffeur: {
                    include: {
                      utilisateur: {
                        select: { nom: true, prenom: true, photo_profil: true }
                      }
                    }
                  },
                  vehicule_course: {
                    include: {
                      vehicule: {
                        select: { marque: true, modele: true, immatriculation: true, couleur: true }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      return res.status(200).json({ success: true, data: reservations });
    } catch (error) {
      console.error('[passager.historique]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },
};

module.exports = PassagerController;
