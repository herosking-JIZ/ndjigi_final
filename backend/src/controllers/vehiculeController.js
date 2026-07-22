/**
 * CONTROLLERS/VEHICULECONTROLLER.JS
 */

const { prisma } = require('../config/db');
const { enregistrerPosition } = require('../services/tracking.service');

const VehiculeController = {

  // ── Lister les véhicules ────────────────────────────────────
  async lister(req, res) {
    try {
      const { statut, id_categorie, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = { supprime_le: null };
      if (statut)       where.statut       = statut;
      if (id_categorie) where.id_categorie = id_categorie;

      const [vehicules, total] = await Promise.all([
        prisma.vehicule.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: {
            proprietaire: {
              include: {
                utilisateur: {
                  select: { nom: true, prenom: true, numero_telephone: true }
                }
              }
            },
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
                        utilisateur: { select: { nom: true, prenom: true } }
                      }
                    }
                  }
                }
              }
            }
          }
        }),
        prisma.vehicule.count({ where })
      ]);

      return res.status(200).json({
        success: true,
        data: vehicules,
        meta: { total, page: parseInt(page), limit: parseInt(limit) }
      });
    } catch (error) {
      console.error('[vehicule.lister]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Récupérer un véhicule ───────────────────────────────────
  async findOne(req, res) {
    try {
      const { id } = req.params;

      const vehicule = await prisma.vehicule.findUnique({
        where: { id_vehicule: id },
        include: {
          proprietaire: {
            include: {
              utilisateur: {
                select: { nom: true, prenom: true, email: true, numero_telephone: true }
              }
            }
          },
          vehicule_course: {
            include: {
              affectation_vehicule: { include: { chauffeur: true } }
            }
          },
          vehicule_location: true,
          tracking_vehicule: {
            orderBy: { horodatage: 'desc' },
            take: 1
          }
        }
      });

      if (!vehicule || vehicule.supprime_le) {
        return res.status(404).json({ success: false, message: 'Véhicule introuvable.' });
      }

      return res.status(200).json({ success: true, data: vehicule });
    } catch (error) {
      console.error('[vehicule.findOne]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Créer un véhicule ───────────────────────────────────────
  // Crée toujours le supertype `vehicule` PUIS son sous-type :
  // type: 'course'   → vehicule_course (véhicule VTC/covoiturage, appartient au chauffeur)
  // type: 'location' → vehicule_location (véhicule de location, enregistré par le proprietaire)
  async creer(req, res) {
    try {
      const {
        type, type_service, tarif_base_location, tarif_par_jour_location,
        immatriculation, marque, modele, annee,
        id_categorie, nb_places, couleur, climatisation, gps_actif
      } = req.body;

      if (!immatriculation || !marque || !modele || !annee || !id_categorie || !nb_places || !type) {
        return res.status(400).json({ success: false, message: 'Champs obligatoires manquants.' });
      }
      if (!['course', 'location'].includes(type)) {
        return res.status(400).json({ success: false, message: 'Type de véhicule invalide.' });
      }
      if (type === 'course' && !type_service) {
        return res.status(400).json({ success: false, message: 'type_service requis pour un véhicule de course.' });
      }

      const idUtilisateur = req.user.id_utilisateur;
      const rolesUser = req.user.utilisateur_role.map(r => r.role);

      // Un chauffeur enregistre un véhicule de course, un proprietaire un véhicule de location.
      // L'admin bypass cette règle (peut créer pour son propre compte, comme avant).
      if (!rolesUser.includes('admin')) {
        if (type === 'course' && !rolesUser.includes('chauffeur')) {
          return res.status(403).json({ success: false, message: 'Seuls les chauffeurs peuvent enregistrer un véhicule de course.' });
        }
        if (type === 'location' && !rolesUser.includes('proprietaire')) {
          return res.status(403).json({ success: false, message: 'Seuls les propriétaires peuvent enregistrer un véhicule de location.' });
        }
        if (type === 'location') {
          const proprietaireExistant = await prisma.proprietaire.findUnique({
            where: { id_proprietaire: idUtilisateur },
            select: { statut_validation: true },
          });
          if (!proprietaireExistant || proprietaireExistant.statut_validation !== 'valide') {
            return res.status(403).json({
              success: false,
              message: 'Votre profil propriétaire doit être validé avant de pouvoir enregistrer un véhicule de location.',
              errors: { code: 'PROPRIETAIRE_NON_VALIDE' },
            });
          }
        }
      }

      const vehicule = await prisma.$transaction(async (tx) => {
        // Le supertype `vehicule` exige toujours un id_proprietaire (FK NOT NULL) —
        // même pour un véhicule de course. On garantit donc une ligne `proprietaire`
        // satellite pour le créateur (même pattern que utilisateurController.ajouterRole),
        // sans lui accorder le rôle/permissions "proprietaire".
        await tx.proprietaire.upsert({
          where: { id_proprietaire: idUtilisateur },
          update: {},
          create: { id_proprietaire: idUtilisateur },
        });

        const created = await tx.vehicule.create({
          data: {
            id_proprietaire: idUtilisateur,
            immatriculation,
            marque,
            modele,
            annee: parseInt(annee),
            id_categorie,
            nb_places: parseInt(nb_places),
            couleur,
            climatisation: climatisation ?? false,
            gps_actif: gps_actif ?? false,
          }
        });

        if (type === 'course') {
          await tx.vehicule_course.create({
            data: {
              id_vehicule: created.id_vehicule,
              id_chauffeur: idUtilisateur,
              type_service,
            }
          });
        } else {
          await tx.vehicule_location.create({
            data: {
              id_vehicule: created.id_vehicule,
              tarif_base_location: tarif_base_location ?? null,
              tarif_par_jour_location: tarif_par_jour_location ?? null,
            }
          });
        }

        return tx.vehicule.findUnique({
          where: { id_vehicule: created.id_vehicule },
          include: { vehicule_course: true, vehicule_location: true }
        });
      });

      return res.status(201).json({ success: true, data: vehicule });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ success: false, message: 'Immatriculation déjà enregistrée.' });
      }
      if (error.code === 'P2003') {
        return res.status(400).json({ success: false, message: 'Catégorie de véhicule ou chauffeur invalide.' });
      }
      console.error('[vehicule.creer]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Mettre à jour un véhicule ───────────────────────────────
  async modifier(req, res) {
    try {
      const { id } = req.params;
      const {
        couleur, climatisation, statut, id_categorie, gps_actif, nb_places,
        type_service, tarif_base_location, tarif_par_jour_location
      } = req.body;

      const vehicule = await prisma.vehicule.update({
        where: { id_vehicule: id },
        data: {
          ...(couleur       !== undefined && { couleur }),
          ...(climatisation !== undefined && { climatisation }),
          ...(statut        !== undefined && { statut }),
          ...(id_categorie  !== undefined && { id_categorie }),
          ...(gps_actif     !== undefined && { gps_actif }),
          ...(nb_places     !== undefined && { nb_places: parseInt(nb_places) }),
          ...(type_service !== undefined && {
            vehicule_course: { update: { type_service } }
          }),
          ...((tarif_base_location !== undefined || tarif_par_jour_location !== undefined) && {
            vehicule_location: {
              update: {
                ...(tarif_base_location     !== undefined && { tarif_base_location }),
                ...(tarif_par_jour_location !== undefined && { tarif_par_jour_location }),
              }
            }
          }),
        }
      });

      return res.status(200).json({ success: true, data: vehicule });
    } catch (error) {
      if (error.code === 'P2003') {
        return res.status(400).json({ success: false, message: 'Catégorie de véhicule invalide.' });
      }
      console.error('[vehicule.modifier]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Soft delete un véhicule ─────────────────────────────────
  async supprimer(req, res) {
    try {
      const { id } = req.params;

      await prisma.vehicule.update({
        where: { id_vehicule: id },
        data: { supprime_le: new Date(), statut: 'retire' }
      });

      return res.status(200).json({ success: true, message: 'Véhicule retiré de la flotte.' });
    } catch (error) {
      console.error('[vehicule.supprimer]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Mettre à jour la position GPS ──────────────────────────
  async updatePosition(req, res) {
    try {
      const { id } = req.params;
      const { latitude, longitude, vitesse, cap } = req.body;

      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ success: false, message: 'Latitude et longitude requises.' });
      }

      await enregistrerPosition(id, { latitude, longitude, vitesse, cap });

      return res.status(200).json({ success: true, message: 'Position mise à jour.' });
    } catch (error) {
      console.error('[vehicule.updatePosition]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Historique tracking ─────────────────────────────────────
  async tracking(req, res) {
    try {
      const { id } = req.params;
      const { limit = 50 } = req.query;

      const historique = await prisma.tracking_vehicule.findMany({
        where: { id_vehicule: id },
        orderBy: { horodatage: 'desc' },
        take: parseInt(limit),
      });

      return res.status(200).json({ success: true, data: historique });
    } catch (error) {
      console.error('[vehicule.tracking]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },
};

module.exports = VehiculeController;
