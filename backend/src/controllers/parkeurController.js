/**
 * PARKEUR CONTROLLER — Gestion des mouvements parking (entrée/sortie)
 */

const { prisma } = require('../config/db');

const TYPES_PRESENTS = new Set(['entree', 'reprise', 'maintenance']);

function estPresent(dernierMouvement) {
  return Boolean(dernierMouvement && TYPES_PRESENTS.has(dernierMouvement.type_mouvement));
}

async function compterPresents(client, parkingId) {
  const vehicules = await client.vehicule.findMany({
    where: { id_parking: parkingId, supprime_le: null },
    select: {
      journal_parking: {
        orderBy: { date_mouvement: 'desc' },
        take: 1,
        select: { type_mouvement: true }
      }
    }
  });
  return vehicules.filter((v) => estPresent(v.journal_parking[0])).length;
}

const ParkeurController = {
  // ── Détail parking pour le gestionnaire ────────────────────
  async detailParking(req, res) {
    try {
      const { parkingId } = req.params;

      const parking = await prisma.parking.findUnique({
        where: { id_parking: parkingId },
        include: {
          gestionnaire_parking: {
            include: {
              utilisateur: { select: { nom: true, prenom: true, email: true } }
            }
          }
        }
      });

      if (!parking) {
        return res.status(404).json({ success: false, message: 'Parking introuvable.' });
      }

      const vehicules = await prisma.vehicule.findMany({
        where: {
          id_parking: parkingId,
          supprime_le: null
        },
        select: {
          journal_parking: {
            orderBy: { date_mouvement: 'desc' },
            take: 1,
            select: { type_mouvement: true, etat_vehicule: true }
          }
        }
      });

      const presents = vehicules.filter((v) => estPresent(v.journal_parking[0]));
      const vehiculesBonEtat = presents.filter(
        (v) => v.journal_parking[0]?.etat_vehicule === 'bon_etat'
      ).length;

      return res.status(200).json({
        success: true,
        data: {
          ...parking,
          capacite_occupee: presents.length,
          capacite_dispo: Math.max(0, (parking.capacite_totale || 0) - presents.length),
          vehicules_bon_etat: vehiculesBonEtat
        }
      });
    } catch (error) {
      console.error('[parkeur.detailParking]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Véhicules garés dans le parking ────────────────────────
  async vehiculesGares(req, res) {
    try {
      const { parkingId } = req.params;
      const { presence = 'present', search = '' } = req.query;

      if (!['present', 'absent', 'all'].includes(presence)) {
        return res.status(400).json({ success: false, message: 'Filtre presence invalide.' });
      }

      const recherche = search.trim();
      const filtreParking = presence === 'absent'
        ? { OR: [{ id_parking: parkingId }, { id_parking: null }] }
        : { id_parking: parkingId };

      const vehicules = await prisma.vehicule.findMany({
        where: {
          supprime_le: null,
          AND: [
            filtreParking,
            ...(recherche ? [{ OR: [
              { immatriculation: { contains: recherche, mode: 'insensitive' } },
              { marque: { contains: recherche, mode: 'insensitive' } },
              { modele: { contains: recherche, mode: 'insensitive' } }
            ] }] : [])
          ]
        },
        include: {
          categorie_vehicule: { select: { nom: true } },
          proprietaire: {
            include: {
              utilisateur: { select: { nom: true, prenom: true } }
            }
          },
          journal_parking: {
            orderBy: { date_mouvement: 'desc' },
            take: 1,
            select: { etat_vehicule: true, type_mouvement: true, date_mouvement: true, id_parking: true }
          }
        }
      });

      const data = vehicules.filter((v) => {
        const present = estPresent(v.journal_parking[0]);
        if (presence === 'present') return present;
        if (presence === 'absent') return !present;
        return true;
      }).map(v => ({
        id_vehicule: v.id_vehicule,
        immatriculation: v.immatriculation,
        marque: v.marque,
        modele: v.modele,
        categorie: v.categorie_vehicule?.nom || 'N/A',
        couleur: v.couleur,
        proprietaire_nom: v.proprietaire?.utilisateur
          ? `${v.proprietaire.utilisateur.prenom} ${v.proprietaire.utilisateur.nom}`
          : 'N/A',
        statut: v.statut,
        etat: v.journal_parking[0]?.etat_vehicule || 'bon_etat',
        date_entree: estPresent(v.journal_parking[0]) ? v.journal_parking[0]?.date_mouvement : null,
        present: estPresent(v.journal_parking[0])
      }));

      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('[parkeur.vehiculesGares]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Mouvements pour ce parking ─────────────────────────────
  async mouvementsParkeur(req, res) {
    try {
      const { parkingId } = req.params;
      const { page = 1, limit = 20, search } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const where = { id_parking: parkingId };

      if (search && search.trim() !== '') {
        where.OR = [
          { vehicule: { immatriculation: { contains: search, mode: 'insensitive' } } },
          { utilisateur: { nom: { contains: search, mode: 'insensitive' } } },
          { utilisateur: { prenom: { contains: search, mode: 'insensitive' } } }
        ];
      }

      const [mouvements, total] = await Promise.all([
        prisma.journal_parking.findMany({
          where,
          orderBy: { date_mouvement: 'desc' },
          skip,
          take: parseInt(limit),
          include: {
            vehicule: { select: { immatriculation: true } },
            utilisateur: { select: { nom: true, prenom: true } },
            mouvementPhotos: {
              orderBy: { uploadedAt: 'asc' },
              select: { id_photo: true, fileKey: true, uploadedAt: true }
            }
          }
        }),
        prisma.journal_parking.count({ where })
      ]);

      const data = mouvements.map(m => ({
        id_log: m.id_log,
        id_vehicule: m.id_vehicule,
        immatriculation: m.vehicule.immatriculation,
        id_parking: m.id_parking,
        parkeur_nom: `${m.utilisateur.prenom} ${m.utilisateur.nom}`,
        type_mouvement: m.type_mouvement,
        etat_vehicule: m.etat_vehicule,
        date_mouvement: m.date_mouvement,
        commentaire: m.commentaire,
        photos: m.mouvementPhotos
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
      console.error('[parkeur.mouvementsParkeur]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Enregistrer une entrée ─────────────────────────────────
  async enregistrerEntree(req, res) {
    try {
      const { parkingId } = req.params;
      const {
        id_vehicule,
        etat_vehicule,
        commentaire
      } = req.body;

      if (!id_vehicule || !etat_vehicule) {
        return res.status(400).json({
          success: false,
          message: 'id_vehicule et etat_vehicule requis.'
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        const [parking, vehicule, dernierMouvement] = await Promise.all([
          tx.parking.findUnique({ where: { id_parking: parkingId } }),
          tx.vehicule.findFirst({ where: { id_vehicule, supprime_le: null } }),
          tx.journal_parking.findFirst({
            where: { id_vehicule },
            orderBy: { date_mouvement: 'desc' }
          })
        ]);

        if (!parking) throw Object.assign(new Error('Parking introuvable.'), { statusCode: 404 });
        if (!vehicule) throw Object.assign(new Error('Véhicule introuvable.'), { statusCode: 404 });
        if (estPresent(dernierMouvement)) {
          throw Object.assign(new Error('Ce véhicule est déjà présent dans un parking.'), { statusCode: 409 });
        }

        const presents = await compterPresents(tx, parkingId);
        if (parking.capacite_totale != null && presents >= parking.capacite_totale) {
          throw Object.assign(new Error('La capacité maximale du parking est atteinte.'), { statusCode: 409 });
        }

        await tx.vehicule.update({
          where: { id_vehicule },
          data: { id_parking: parkingId }
        });

        // Créer le mouvement
        const mouvement = await tx.journal_parking.create({
          data: {
            id_vehicule,
            id_parking: parkingId,
            id_utilisateur: req.user.id_utilisateur,
            type_mouvement: 'entree',
            etat_vehicule,
            commentaire: commentaire || null,
            besoin_maintenance: etat_vehicule !== 'bon_etat'
          },
          include: {
            vehicule: { select: { immatriculation: true } }
          }
        });

        // Mettre à jour la capacité
        await tx.parking.update({
          where: { id_parking: parkingId },
          data: { capacite_occupee: presents + 1 }
        });

        return mouvement;
      }, { isolationLevel: 'Serializable' });

      return res.status(201).json({
        success: true,
        message: 'Entrée enregistrée.',
        data: {
          id_log: result.id_log,
          id_vehicule: result.id_vehicule,
          immatriculation: result.vehicule.immatriculation,
          etat_vehicule: result.etat_vehicule,
          besoin_maintenance: result.besoin_maintenance
        }
      });
    } catch (error) {
      console.error('[parkeur.enregistrerEntree]', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.statusCode ? error.message : 'Erreur serveur.'
      });
    }
  },

  // ── Enregistrer une sortie ────────────────────────────────
  async enregistrerSortie(req, res) {
    try {
      const { parkingId } = req.params;
      const {
        id_vehicule,
        etat_vehicule,
        commentaire
      } = req.body;

      if (!id_vehicule || !etat_vehicule) {
        return res.status(400).json({
          success: false,
          message: 'id_vehicule et etat_vehicule requis.'
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        const vehicule = await tx.vehicule.findFirst({
          where: { id_vehicule, id_parking: parkingId, supprime_le: null }
        });
        if (!vehicule) {
          throw Object.assign(new Error("Ce véhicule n'est pas affecté à ce parking."), { statusCode: 404 });
        }

        const dernierMouvement = await tx.journal_parking.findFirst({
          where: { id_vehicule },
          orderBy: { date_mouvement: 'desc' }
        });
        if (!estPresent(dernierMouvement) || dernierMouvement.id_parking !== parkingId) {
          throw Object.assign(new Error("Ce véhicule n'est pas actuellement présent dans ce parking."), { statusCode: 409 });
        }

        const tempsStationnement = dernierMouvement.date_mouvement
          ? Math.max(0, Math.floor((Date.now() - new Date(dernierMouvement.date_mouvement).getTime()) / 1000))
          : 0;
        const presents = await compterPresents(tx, parkingId);

        // Créer le mouvement
        const mouvement = await tx.journal_parking.create({
          data: {
            id_vehicule,
            id_parking: parkingId,
            id_utilisateur: req.user.id_utilisateur,
            type_mouvement: 'sortie',
            etat_vehicule,
            commentaire: commentaire || null,
            besoin_maintenance: etat_vehicule !== 'bon_etat'
          },
          include: {
            vehicule: { select: { immatriculation: true } }
          }
        });

        // Mettre à jour la capacité
        await tx.parking.update({
          where: { id_parking: parkingId },
          data: { capacite_occupee: Math.max(0, presents - 1) }
        });

        return { mouvement, tempsStationnement };
      }, { isolationLevel: 'Serializable' });

      return res.status(201).json({
        success: true,
        message: 'Sortie enregistrée.',
        data: {
          id_log: result.mouvement.id_log,
          id_vehicule: result.mouvement.id_vehicule,
          immatriculation: result.mouvement.vehicule.immatriculation,
          etat_vehicule: result.mouvement.etat_vehicule,
          temps_stationnement: result.tempsStationnement
        }
      });
    } catch (error) {
      console.error('[parkeur.enregistrerSortie]', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.statusCode ? error.message : 'Erreur serveur.'
      });
    }
  }
};

module.exports = ParkeurController;
