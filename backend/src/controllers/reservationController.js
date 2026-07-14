/**
 * CONTROLLERS/RESERVATIONCONTROLLER.JS
 */

const { prisma } = require('../config/db');

const ReservationController = {

  // ── Lister les réservations ─────────────────────────────────
  async lister(req, res) {
    try {
      const { statut, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {};
      if (statut) where.statut = statut;

      const [reservations, total] = await Promise.all([
        prisma.reservation.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { date_reservation: 'desc' },
          include: {
            passager: {
              include: {
                utilisateur: { select: { nom: true, prenom: true, photo_profil: true } }
              }
            },
            trajet: {
              include: { zone_tarifaire: true }
            }
          }
        }),
        prisma.reservation.count({ where })
      ]);

      return res.status(200).json({
        success: true,
        data: reservations,
        meta: { total, page: parseInt(page), limit: parseInt(limit) }
      });
    } catch (error) {
      console.error('[reservation.lister]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Réserver un trajet ──────────────────────────────────────
  async reserver(req, res) {
    try {
      const { id_trajet } = req.params;
      const { date_trajet_souhaite, id_code_promo } = req.body;
      const id_passager = req.user.id_utilisateur;

      if (!date_trajet_souhaite) {
        return res.status(400).json({ success: false, message: 'date_trajet_souhaite requis.' });
      }

      // Vérifier que le trajet existe et est disponible
      const trajet = await prisma.trajet.findUnique({ where: { id_trajet } });
      if (!trajet || trajet.statut !== 'en_attente') {
        return res.status(400).json({ success: false, message: 'Trajet indisponible.' });
      }

      // Vérifier que le passager n'a pas déjà réservé ce trajet
      const dejaReserve = await prisma.reservation.findFirst({
        where: { id_passager, id_trajet, statut: { not: 'annule' } }
      });
      if (dejaReserve) {
        return res.status(409).json({ success: false, message: 'Vous avez déjà réservé ce trajet.' });
      }

      const result = await prisma.$transaction(async (tx) => {
        const reservation = await tx.reservation.create({
          data: {
            id_passager,
            id_trajet,
            date_trajet_souhaite: new Date(date_trajet_souhaite),
            statut: 'en_attente',
          }
        });

        // Appliquer code promo si fourni
        if (id_code_promo) {
          const promo = await tx.code_promo.findUnique({
            where: { id_promo: id_code_promo }
          });

          if (!promo || !promo.actif) {
            throw new Error('Code promo invalide ou inactif.');
          }
          if (promo.date_fin && new Date() > new Date(promo.date_fin)) {
            throw new Error('Code promo expiré.');
          }
          if (promo.nb_utilisations_max && promo.nb_utilisations_actuel >= promo.nb_utilisations_max) {
            throw new Error('Code promo épuisé.');
          }

          // Vérifier usage unique par utilisateur
          const dejaUtilise = await tx.utilisation_promo.findUnique({
            where: { id_utilisateur_id_promo: { id_utilisateur: id_passager, id_promo: id_code_promo } }
          });
          if (dejaUtilise) {
            throw new Error('Vous avez déjà utilisé ce code promo.');
          }

          await tx.utilisation_promo.create({
            data: {
              id_utilisateur: id_passager,
              id_promo:       id_code_promo,
              id_trajet,
            }
          });

          // Incrémenter atomiquement
          await tx.code_promo.update({
            where: { id_promo: id_code_promo },
            data: { nb_utilisations_actuel: { increment: 1 } }
          });
        }

        // Incrémenter nb_courses du passager
        await tx.passager.update({
          where: { id_passager },
          data: { nb_courses_effectuees: { increment: 1 } }
        });

        return reservation;
      });

      return res.status(201).json({ success: true, data: result });
    } catch (error) {
      if (error.message.includes('Code promo') || error.message.includes('déjà utilisé')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      console.error('[reservation.reserver]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Annuler une réservation ─────────────────────────────────
  async annuler(req, res) {
    try {
      const { id } = req.params;
      const id_passager = req.user.id_utilisateur;

      const reservation = await prisma.reservation.findUnique({
        where: { id_reservation: id }
      });

      if (!reservation) {
        return res.status(404).json({ success: false, message: 'Réservation introuvable.' });
      }
      if (reservation.id_passager !== id_passager) {
        return res.status(403).json({ success: false, message: 'Action non autorisée.' });
      }
      if (reservation.statut === 'annule') {
        return res.status(400).json({ success: false, message: 'Réservation déjà annulée.' });
      }

      const updated = await prisma.reservation.update({
        where: { id_reservation: id },
        data: { statut: 'annule' }
      });

      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error('[reservation.annuler]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Mes réservations (passager connecté) ────────────────────
  async mesReservations(req, res) {
    try {
      const id_passager = req.user.id_utilisateur;
      const { statut, page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = { id_passager };
      if (statut) where.statut = statut;

      const reservations = await prisma.reservation.findMany({
        where,
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
                      utilisateur: { select: { nom: true, prenom: true, photo_profil: true } }
                    }
                  },
                  vehicule_course: {
                    include: {
                      vehicule: { select: { marque: true, modele: true, couleur: true, immatriculation: true } }
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
      console.error('[reservation.mesReservations]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },
};

module.exports = ReservationController;
