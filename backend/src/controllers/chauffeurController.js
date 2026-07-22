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

      if (!['valide', 'refuse', 'en_attente', 'suspendu'].includes(statut_validation)) {
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

      // `en_course` est une transition métier réservée au cycle du trajet.
      if (!['en_ligne', 'hors_ligne'].includes(statut_disponibilite)) {
        return res.status(400).json({
          success: false,
          message: 'Le chauffeur peut uniquement passer en ligne ou hors ligne.',
          errors: { code: 'STATUT_NON_MODIFIABLE' },
        });
      }

      const chauffeurActuel = await prisma.chauffeur.findUnique({
        where: { id_chauffeur: id },
        include: {
          utilisateur: { select: { statut_compte: true, supprime_le: true } },
          affectation_vehicule: {
            where: { est_active: true },
            take: 1,
            include: { vehicule_course: { include: { vehicule: true } } },
          },
        },
      });
      if (!chauffeurActuel) {
        return res.status(404).json({ success: false, message: 'Profil chauffeur introuvable.', errors: { code: 'CHAUFFEUR_INTROUVABLE' } });
      }

      const courseActive = await prisma.trajet.findFirst({
        where: {
          affectation_vehicule: { id_chauffeur: id },
          statut: { in: ['chauffeur_trouve', 'confirme', 'en_cours'] },
        },
        select: { id_trajet: true },
      });
      if (courseActive) {
        return res.status(409).json({
          success: false,
          message: 'La disponibilité ne peut pas être modifiée pendant une course.',
          data: courseActive,
          errors: { code: 'COURSE_ACTIVE' },
        });
      }

      if (statut_disponibilite === 'en_ligne') {
        if (chauffeurActuel.statut_validation !== 'valide') {
          return res.status(403).json({ success: false, message: 'Le profil chauffeur doit être validé.', errors: { code: 'CHAUFFEUR_NON_VALIDE' } });
        }
        if (chauffeurActuel.utilisateur?.statut_compte !== 'actif' || chauffeurActuel.utilisateur?.supprime_le) {
          return res.status(403).json({ success: false, message: 'Ce compte ne peut pas être mis en ligne.', errors: { code: 'COMPTE_INACTIF' } });
        }
        if (chauffeurActuel.date_expiration_permis && chauffeurActuel.date_expiration_permis < new Date()) {
          return res.status(403).json({ success: false, message: 'Le permis de conduire est expiré.', errors: { code: 'PERMIS_EXPIRE' } });
        }
        const affectation = chauffeurActuel.affectation_vehicule[0];
        if (!affectation) {
          return res.status(409).json({ success: false, message: 'Aucun véhicule actif n’est affecté.', errors: { code: 'NO_ACTIVE_VEHICLE' } });
        }
        if (affectation.vehicule_course?.vehicule?.statut !== 'disponible') {
          return res.status(409).json({ success: false, message: 'Le véhicule affecté n’est pas disponible.', errors: { code: 'VEHICULE_INDISPONIBLE' } });
        }
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

      const latitudeNombre = Number(latitude);
      const longitudeNombre = Number(longitude);
      const vitesseNombre = vitesse == null ? null : Number(vitesse);
      const capNombre = cap == null ? null : Number(cap);
      const positionValide = Number.isFinite(latitudeNombre)
        && latitudeNombre >= -90 && latitudeNombre <= 90
        && Number.isFinite(longitudeNombre)
        && longitudeNombre >= -180 && longitudeNombre <= 180
        && (vitesseNombre == null || (Number.isFinite(vitesseNombre) && vitesseNombre >= 0 && vitesseNombre <= 300))
        && (capNombre == null || (Number.isFinite(capNombre) && capNombre >= 0 && capNombre <= 360));

      if (!positionValide) {
        return res.status(400).json({
          success: false,
          message: 'Coordonnées GPS invalides.',
          errors: { code: 'INVALID_POSITION' }
        });
      }

      const chauffeur = await prisma.chauffeur.findUnique({
        where: { id_chauffeur },
        select: { statut_disponibilite: true },
      });
      if (!chauffeur || !['en_ligne', 'en_course'].includes(chauffeur.statut_disponibilite)) {
        return res.status(409).json({
          success: false,
          message: 'Le chauffeur doit être en ligne pour envoyer sa position.',
          errors: { code: 'CHAUFFEUR_HORS_LIGNE' },
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

      await enregistrerPosition(affectation.id_vehicule, {
        latitude: latitudeNombre,
        longitude: longitudeNombre,
        vitesse: vitesseNombre,
        cap: capNombre,
      });

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
