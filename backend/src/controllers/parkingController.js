/**
 * CONTROLLERS/PARKINGCONTROLLER.JS
 */

const { prisma } = require('../config/db');

// ─────────────────────────────────────────────────────────────
// PARKING
// ─────────────────────────────────────────────────────────────

const ParkingController = {

  // ── Lister tous les mouvements (historique global ou filtrable) ───
  async mouvements(req, res) {
    try {
      const { search } = req.query;

      const where = {};
      if (search && search.trim() !== '') {
        where.OR = [
          { vehicule: { immatriculation: { contains: search, mode: 'insensitive' } } },
          { parking: { nom: { contains: search, mode: 'insensitive' } } },
          { utilisateur: { nom: { contains: search, mode: 'insensitive' } } },
          { utilisateur: { prenom: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const logs = await prisma.journal_parking.findMany({
        where,
        orderBy: { date_mouvement: 'desc' },
        take: 100, // Limite pour éviter de tout charger
        include: {
          vehicule: { select: { immatriculation: true } },
          parking: { select: { nom: true } },
          utilisateur: { select: { nom: true, prenom: true } }
        }
      });

      const data = logs.map(log => ({
        id_log: log.id_log,
        id_vehicule: log.id_vehicule,
        immatriculation: log.vehicule?.immatriculation || '—',
        id_parking: log.id_parking,
        parking_nom: log.parking?.nom || '—',
        parkeur_nom: log.utilisateur ? `${log.utilisateur.prenom} ${log.utilisateur.nom}` : '—',
        type_mouvement: log.type_mouvement,
        etat_vehicule: log.etat_vehicule,
        date_mouvement: log.date_mouvement,
        commentaire: log.besoin_maintenance ? "Nécessite maintenance" : null,
      }));

      return res.status(200).json({ success: true, message: 'Mouvements récupérés.', data });
    } catch (error) {
      console.error('[parking.mouvements]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Lister les parkings ─────────────────────────────────────
  async lister(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [parkingsDb, total] = await Promise.all([
        prisma.parking.findMany({
          skip,
          take: parseInt(limit),
          include: {
            gestionnaire_parking: {
              include: {
                utilisateur: { select: { nom: true, prenom: true } }
              }
            }
          }
        }),
        prisma.parking.count()
      ]);

      // Mapping pour respecter l'interface Frontend Parking (ville, horaires, actif n'existent pas en base)
      const parkings = parkingsDb.map(p => ({
        ...p,
        ville: 'Ouagadougou', // Valeur par défaut
        horaires: '24h/24 - 7j/7', // Valeur par défaut
        actif: true // On force à actif en attendant l'ajout en base
      }));

      return res.status(200).json({
        success: true,
        data: parkings,
        meta: { total, page: parseInt(page), limit: parseInt(limit) }
      });
    } catch (error) {
      console.error('[parking.lister]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Récupérer un parking ────────────────────────────────────
  async findOne(req, res) {
    try {
      const { id } = req.params;

      const parkingDb = await prisma.parking.findUnique({
        where: { id_parking: id },
        include: {
          gestionnaire_parking: {
            include: {
              utilisateur: { select: { nom: true, prenom: true, email: true, numero_telephone: true } }
            }
          },
          journal_parking: {
            orderBy: { date_mouvement: 'desc' },
            take: 10,
            include: {
              vehicule: { select: { marque: true, modele: true, immatriculation: true } }
            }
          }
        }
      });

      if (!parkingDb) {
        return res.status(404).json({ success: false, message: 'Parking introuvable.' });
      }

      // Mapping Frontend
      const parking = {
        ...parkingDb,
        ville: 'Ouagadougou',
        horaires: '24h/24 - 7j/7',
        actif: true
      };

      return res.status(200).json({ success: true, data: parking });
    } catch (error) {
      console.error('[parking.findOne]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Créer un parking (admin) ────────────────────────────────
  async creer(req, res) {
    try {
      const { nom, adresse, ville, horaires, capacite_totale, latitude, longitude } = req.body;

      const parking = await prisma.parking.create({
        data: {
          nom,
          adresse,
          ville: ville || 'Ouagadougou',
          horaires: horaires || '24h/24 - 7j/7',
          capacite_totale: capacite_totale ? parseInt(capacite_totale) : null,
          capacite_occupee: 0,
          latitude:        latitude  ? parseFloat(latitude)  : null,
          longitude:       longitude ? parseFloat(longitude) : null,
        }
      });

      return res.status(201).json({ success: true, data: parking });
    } catch (error) {
      console.error('[parking.creer]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Modifier un parking ─────────────────────────────────────
  async modifier(req, res) {
    try {
      const { id } = req.params;
      const { nom, adresse, capacite_totale, latitude, longitude } = req.body;

      const parking = await prisma.parking.update({
        where: { id_parking: id },
        data: {
          ...(nom             && { nom }),
          ...(adresse         && { adresse }),
          ...(capacite_totale !== undefined && { capacite_totale: parseInt(capacite_totale) }),
          ...(latitude        !== undefined && { latitude:  parseFloat(latitude) }),
          ...(longitude       !== undefined && { longitude: parseFloat(longitude) }),
        }
      });

      return res.status(200).json({ success: true, data: parking });
    } catch (error) {
      console.error('[parking.modifier]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Ajouter un mouvement (entrée / sortie véhicule) ─────────
  async ajouterMouvement(req, res) {
    return res.status(410).json({
      success: false,
      message: 'Endpoint remplacé. Utilisez /parkings/:parkingId/entree ou /parkings/:parkingId/sortie.'
    });
  },
};

// ─────────────────────────────────────────────────────────────
// GESTIONNAIRE PARKING
// ─────────────────────────────────────────────────────────────

const GestionnaireController = {

  // ── Assigner un gestionnaire à un parking ───────────────────
  async assigner(req, res) {
    try {
      const { id_gestionnaire, id_parking, date_prise_poste } = req.body;

      if (!id_gestionnaire || !id_parking) {
        return res.status(400).json({ success: false, message: 'id_gestionnaire et id_parking requis.' });
      }

      // Vérifier que l'utilisateur existe et a le rôle gestionnaire
      const roleExiste = await prisma.utilisateur_role.findUnique({
        where: {
          id_utilisateur_role: { id_utilisateur: id_gestionnaire, role: 'gestionnaire' }
        }
      });

      if (!roleExiste || !roleExiste.actif) {
        return res.status(400).json({ success: false, message: 'Cet utilisateur n\'a pas le rôle gestionnaire.' });
      }

      const gestionnaire = await prisma.gestionnaire_parking.create({
        data: {
          id_gestionnaire,
          id_parking,
          date_prise_poste: date_prise_poste ? new Date(date_prise_poste) : new Date(),
        },
        include: {
          utilisateur: { select: { nom: true, prenom: true, email: true } },
          parking:     { select: { nom: true, adresse: true } }
        }
      });

      return res.status(201).json({ success: true, data: gestionnaire });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ success: false, message: 'Ce gestionnaire est déjà assigné.' });
      }
      console.error('[gestionnaire.assigner]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Lister les gestionnaires d'un parking ───────────────────
  async parParking(req, res) {
    try {
      const { id_parking } = req.params;

      const gestionnaires = await prisma.gestionnaire_parking.findMany({
        where: { id_parking },
        include: {
          utilisateur: {
            select: { nom: true, prenom: true, email: true, numero_telephone: true, photo_profil: true }
          }
        }
      });

      return res.status(200).json({ success: true, data: gestionnaires });
    } catch (error) {
      console.error('[gestionnaire.parParking]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },
};

// ─────────────────────────────────────────────────────────────
// INCIDENT SÉCURITÉ
// ─────────────────────────────────────────────────────────────

const IncidentController = {

  // ── Lister les incidents ────────────────────────────────────
  async lister(req, res) {
    try {
      const { type_incident, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {};
      if (type_incident) where.type_incident = type_incident;

      const [incidents, total] = await Promise.all([
        prisma.incident_securite.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { date_declenchement: 'desc' },
          include: {
            utilisateur: { select: { nom: true, prenom: true, email: true } },
            trajet: {
              select: { adresse_depart: true, adresse_arrivee: true, statut: true }
            }
          }
        }),
        prisma.incident_securite.count({ where })
      ]);

      return res.status(200).json({
        success: true,
        data: incidents,
        meta: { total, page: parseInt(page), limit: parseInt(limit) }
      });
    } catch (error) {
      console.error('[incident.lister]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Déclarer un incident ────────────────────────────────────
  async declarer(req, res) {
    try {
      const { type_incident, description, id_trajet } = req.body;
      const id_declencheur = req.user.id_utilisateur;

      if (!type_incident) {
        return res.status(400).json({ success: false, message: 'type_incident requis.' });
      }

      const incident = await prisma.$transaction(async (tx) => {
        const inc = await tx.incident_securite.create({
          data: {
            id_declencheur,
            type_incident,
            description:  description ?? null,
            id_trajet:    id_trajet   ?? null,
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
              type:           'incident',
              titre:          `Incident déclaré : ${type_incident}`,
              contenu:        description ?? 'Un incident a été signalé.',
              id_objet_lie:   inc.id_incident,
            }))
          });
        }

        return inc;
      });

      return res.status(201).json({ success: true, data: incident });
    } catch (error) {
      console.error('[incident.declarer]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Récupérer un incident ───────────────────────────────────
  async findOne(req, res) {
    try {
      const { id } = req.params;

      const incident = await prisma.incident_securite.findUnique({
        where: { id_incident: id },
        include: {
          utilisateur: { select: { nom: true, prenom: true, email: true, numero_telephone: true } },
          trajet:      true
        }
      });

      if (!incident) {
        return res.status(404).json({ success: false, message: 'Incident introuvable.' });
      }

      return res.status(200).json({ success: true, data: incident });
    } catch (error) {
      console.error('[incident.findOne]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },
};

module.exports = { ParkingController, GestionnaireController, IncidentController };
