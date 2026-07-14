/**
 * CONTROLLERS/TRAJETPARTAGECONTROLLER.JS
 * Trip share management endpoints
 */

const { prisma } = require('../config/db');
const { generateShareToken } = require('../utils/tokenGenerator');

const SHARE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours
const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

const trajetPartageController = {
  /**
   * POST /trajets/:id/partager
   * Create or return an active share link for this passenger
   * Auth required: authenticated passenger
   */
  async createPartage(req, res) {
    try {
      const id_trajet = req.params.id;
      const id_utilisateur = req.user.id_utilisateur;

      // 1. Verify trajet exists and is shareable
      const trajet = await prisma.trajet.findUnique({
        where: { id_trajet },
        select: { id_trajet: true, statut: true, id_affectation: true }
      });

      if (!trajet) {
        return res.status(404).json({
          success: false,
          message: 'Trajet introuvable.',
          errors: { code: 'TRAJET_NOT_FOUND' }
        });
      }

      // Only active trajets can be shared
      if (!['en_attente', 'en_cours'].includes(trajet.statut)) {
        return res.status(400).json({
          success: false,
          message: 'Ce trajet ne peut plus être partagé.',
          errors: { code: 'TRAJET_NOT_SHAREABLE', statut: trajet.statut }
        });
      }

      // 2. Verify user is a passenger of this trajet
      const estPassager = await prisma.detail_trajet_passager.findUnique({
        where: {
          id_trajet_id_passager: {
            id_trajet,
            id_passager: id_utilisateur
          }
        }
      });

      if (!estPassager) {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'êtes pas passager de ce trajet.',
          errors: { code: 'NOT_A_PASSENGER' }
        });
      }

      // 3. Check if active share already exists (idempotence)
      const partageExistant = await prisma.trajet_partage.findFirst({
        where: {
          id_trajet,
          cree_par: id_utilisateur,
          actif: true,
          expire_a: { gt: new Date() }
        }
      });

      if (partageExistant) {
        return res.status(200).json({
          success: true,
          message: 'Lien de partage existant.',
          data: {
            token: partageExistant.token,
            url: `${BASE_URL}/t/${partageExistant.token}`,
            expire_a: partageExistant.expire_a,
            nouveau: false
          }
        });
      }

      // 4. Generate unique token (retry if collision — very rare)
      let token;
      let tentatives = 0;
      do {
        token = generateShareToken();
        const collision = await prisma.trajet_partage.findUnique({ where: { token } });
        if (!collision) break;
        tentatives++;
      } while (tentatives < 3);

      if (tentatives >= 3) {
        return res.status(500).json({
          success: false,
          message: 'Impossible de générer un token unique.',
          errors: { code: 'TOKEN_GENERATION_FAILED' }
        });
      }

      // 5. Create share
      const partage = await prisma.trajet_partage.create({
        data: {
          id_trajet,
          cree_par: id_utilisateur,
          token,
          expire_a: new Date(Date.now() + SHARE_DURATION_MS),
          actif: true
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Lien de partage créé.',
        data: {
          token: partage.token,
          url: `${BASE_URL}/t/${partage.token}`,
          expire_a: partage.expire_a,
          nouveau: true
        }
      });
    } catch (error) {
      console.error('[trajetPartageController.createPartage]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        errors: { code: 'INTERNAL_ERROR', details: error.message }
      });
    }
  },

  /**
   * GET /public/t/:token
   * Static trajet data — PUBLIC, no authentication
   */
  async getTrajetPublic(req, res) {
    try {
      const { token } = req.params;

      // 1. Find share by token with relations
      const partage = await prisma.trajet_partage.findUnique({
        where: { token },
        include: {
          trajet: {
            select: {
              id_trajet: true,
              statut: true,
              adresse_depart: true,
              adresse_arrivee: true,
              date_heure_debut: true,
              duree_estimee_min: true,
              distance_km: true,
              affectation_vehicule: {
                select: {
                  chauffeur: {
                    select: {
                      utilisateur: {
                        select: {
                          prenom: true,
                          photo_profil: true
                        }
                      }
                    }
                  },
                  vehicule_course: {
                    select: {
                      vehicule: {
                        select: {
                          marque: true,
                          modele: true,
                          couleur: true,
                          immatriculation: true,
                          categorie_vehicule: {
                            select: { nom: true }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      // 2. Validations
      if (!partage) {
        return res.status(404).json({
          success: false,
          message: 'Lien invalide.',
          errors: { code: 'INVALID_TOKEN' }
        });
      }

      if (!partage.actif) {
        return res.status(410).json({
          success: false,
          message: 'Ce lien a été révoqué.',
          errors: { code: 'TOKEN_REVOKED' }
        });
      }

      if (partage.expire_a < new Date()) {
        return res.status(410).json({
          success: false,
          message: 'Ce lien a expiré.',
          errors: { code: 'TOKEN_EXPIRED' }
        });
      }

      // 3. Increment consultation counter (fire & forget)
      prisma.trajet_partage
        .update({
          where: { id_partage: partage.id_partage },
          data: { nb_consultations: { increment: 1 } }
        })
        .catch(err => console.error('[trajetPartage] compteur update failed:', err));

      // 4. Build public response (no sensitive data)
      const trajet = partage.trajet;
      const vehicule = trajet.affectation_vehicule?.vehicule_course?.vehicule;
      const chauffeur = trajet.affectation_vehicule?.chauffeur?.utilisateur;

      return res.status(200).json({
        success: true,
        data: {
          statut: trajet.statut,
          adresse_depart: trajet.adresse_depart,
          adresse_arrivee: trajet.adresse_arrivee,
          date_heure_debut: trajet.date_heure_debut,
          duree_estimee_min: trajet.duree_estimee_min,
          distance_km: trajet.distance_km,
          chauffeur: {
            prenom: chauffeur?.prenom || null,
            photo_profil: chauffeur?.photo_profil || null
          },
          vehicule: vehicule
            ? {
                marque: vehicule.marque,
                modele: vehicule.modele,
                couleur: vehicule.couleur,
                immatriculation: vehicule.immatriculation,
                categorie: vehicule.categorie_vehicule?.nom || null
              }
            : null,
          expire_a: partage.expire_a
        }
      });
    } catch (error) {
      console.error('[trajetPartageController.getTrajetPublic]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        errors: { code: 'INTERNAL_ERROR', details: error.message }
      });
    }
  },

  /**
   * GET /public/t/:token/position
   * Live vehicle position — PUBLIC, rate limited
   * Called by client every 5 seconds (polling)
   */
  async getPositionLive(req, res) {
    try {
      const { token } = req.params;

      // 1. Validate token (minimal read for perf)
      const partage = await prisma.trajet_partage.findUnique({
        where: { token },
        select: {
          actif: true,
          expire_a: true,
          trajet: {
            select: {
              statut: true,
              date_heure_debut: true,
              duree_estimee_min: true,
              affectation_vehicule: {
                select: {
                  vehicule_course: {
                    select: {
                      vehicule: {
                        select: {
                          latitude_actuelle: true,
                          longitude_actuelle: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!partage || !partage.actif || partage.expire_a < new Date()) {
        return res.status(410).json({
          success: false,
          message: 'Lien invalide ou expiré.',
          errors: { code: 'TOKEN_INVALID' }
        });
      }

      const trajet = partage.trajet;
      const vehicule = trajet.affectation_vehicule?.vehicule_course?.vehicule;

      // 2. If trajet is complete — signal client to stop polling
      if (['termine', 'annule'].includes(trajet.statut)) {
        return res.status(200).json({
          success: true,
          data: {
            statut: trajet.statut,
            position: null,
            eta_minutes: 0,
            polling: false
          }
        });
      }

      // 3. Calculate simple ETA
      let eta_minutes = null;
      if (trajet.date_heure_debut && trajet.duree_estimee_min) {
        const tempsEcoule = Math.floor(
          (Date.now() - new Date(trajet.date_heure_debut).getTime()) / 60000
        );
        eta_minutes = Math.max(0, trajet.duree_estimee_min - tempsEcoule);
      }

      return res.status(200).json({
        success: true,
        data: {
          statut: trajet.statut,
          position: vehicule?.latitude_actuelle
            ? {
                latitude: parseFloat(vehicule.latitude_actuelle),
                longitude: parseFloat(vehicule.longitude_actuelle)
              }
            : null,
          eta_minutes,
          polling: true
        }
      });
    } catch (error) {
      console.error('[trajetPartageController.getPositionLive]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        errors: { code: 'INTERNAL_ERROR', details: error.message }
      });
    }
  },

  /**
   * DELETE /trajets/:id/partager
   * Revoke the share link
   * Auth required: passenger creator of the link
   */
  async revokePartage(req, res) {
    try {
      const id_trajet = req.params.id;
      const id_utilisateur = req.user.id_utilisateur;

      const partage = await prisma.trajet_partage.findFirst({
        where: {
          id_trajet,
          cree_par: id_utilisateur,
          actif: true
        }
      });

      if (!partage) {
        return res.status(404).json({
          success: false,
          message: 'Aucun lien de partage actif trouvé.',
          errors: { code: 'PARTAGE_NOT_FOUND' }
        });
      }

      await prisma.trajet_partage.update({
        where: { id_partage: partage.id_partage },
        data: { actif: false }
      });

      return res.status(200).json({
        success: true,
        message: 'Lien de partage révoqué.',
        data: null
      });
    } catch (error) {
      console.error('[trajetPartageController.revokePartage]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        errors: { code: 'INTERNAL_ERROR', details: error.message }
      });
    }
  }
};

module.exports = trajetPartageController;
