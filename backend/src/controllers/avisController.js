const { prisma } = require('../config/db');
// ─────────────────────────────────────────────────────────────
// AVIS
// ─────────────────────────────────────────────────────────────

const AvisController = {

  // ── Lister les avis ─────────────────────────────────────────
  async lister(req, res) {
    try {
      const { id_evalue, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {};
      if (id_evalue) where.id_evalue = id_evalue;

      const [avis, total] = await Promise.all([
        prisma.avis.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { date_avis: 'desc' },
          include: {
            utilisateur_avis_id_evaluateurToutilisateur: {
              select: { nom: true, prenom: true, photo_profil: true }
            },
            trajet: {
              select: { adresse_depart: true, adresse_arrivee: true }
            }
          }
        }),
        prisma.avis.count({ where })
      ]);

      return res.status(200).json({
        success: true,
        data: avis,
        meta: { total, page: parseInt(page), limit: parseInt(limit) }
      });
    } catch (error) {
      console.error('[avis.lister]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Laisser un avis ─────────────────────────────────────────
  async creer(req, res) {
    try {
      const { id_evalue, id_trajet, id_location, note, commentaire } = req.body;
      const id_evaluateur = req.user.id_utilisateur;

      if (!id_evalue || !note) {
        return res.status(400).json({ success: false, message: 'id_evalue et note requis.' });
      }
      if (note < 1 || note > 5) {
        return res.status(400).json({ success: false, message: 'La note doit être entre 1 et 5.' });
      }
      if (id_evaluateur === id_evalue) {
        return res.status(400).json({ success: false, message: 'Vous ne pouvez pas vous évaluer vous-même.' });
      }

      if (id_trajet) {
        const trajet = await prisma.trajet.findUnique({
          where: { id_trajet },
          include: {
            affectation_vehicule: { select: { id_chauffeur: true } },
            passagers_du_trajet: { select: { id_passager: true } },
          },
        });
        if (!trajet) {
          return res.status(404).json({ success: false, message: 'Trajet introuvable.', errors: { code: 'TRAJET_INTROUVABLE' } });
        }
        if (trajet.statut !== 'termine') {
          return res.status(409).json({ success: false, message: 'Le trajet doit être terminé avant sa notation.', errors: { code: 'TRAJET_NON_TERMINE' } });
        }
        const idChauffeur = trajet.affectation_vehicule?.id_chauffeur;
        const idsPassagers = trajet.passagers_du_trajet.map(({ id_passager }) => id_passager);
        const evaluateurParticipe = id_evaluateur === idChauffeur || idsPassagers.includes(id_evaluateur);
        const evalueEstContrepartie = id_evaluateur === idChauffeur
          ? idsPassagers.includes(id_evalue)
          : id_evalue === idChauffeur;
        if (!evaluateurParticipe || !evalueEstContrepartie) {
          return res.status(403).json({ success: false, message: 'Cet avis ne concerne pas les participants du trajet.', errors: { code: 'AVIS_FORBIDDEN' } });
        }

        const avisExistant = await prisma.avis.findFirst({ where: { id_evaluateur, id_trajet } });
        if (avisExistant) {
          return res.status(409).json({ success: false, message: 'Vous avez déjà noté cette course.', errors: { code: 'AVIS_DEJA_ENVOYE' } });
        }
      } else if (id_location) {
        const location = await prisma.location.findUnique({
          where: { id_location },
          include: {
            passager: { select: { id_passager: true } },
            vehicule: { include: { vehicule: { select: { id_proprietaire: true } } } },
          },
        });
        if (!location) {
          return res.status(404).json({ success: false, message: 'Location introuvable.', errors: { code: 'LOCATION_INTROUVABLE' } });
        }
        if (location.statut !== 'terminee') {
          return res.status(409).json({ success: false, message: 'La location doit être terminée avant sa notation.', errors: { code: 'LOCATION_NON_TERMINEE' } });
        }
        const idPassager = location.passager.id_passager;
        const idProprietaire = location.vehicule.vehicule.id_proprietaire;
        const evaluateurParticipe = id_evaluateur === idPassager || id_evaluateur === idProprietaire;
        const evalueEstContrepartie = id_evaluateur === idPassager ? id_evalue === idProprietaire : id_evalue === idPassager;
        if (!evaluateurParticipe || !evalueEstContrepartie) {
          return res.status(403).json({ success: false, message: 'Cet avis ne concerne pas les participants de cette location.', errors: { code: 'AVIS_FORBIDDEN' } });
        }

        const avisExistant = await prisma.avis.findFirst({ where: { id_evaluateur, id_location } });
        if (avisExistant) {
          return res.status(409).json({ success: false, message: 'Vous avez déjà noté cette location.', errors: { code: 'AVIS_DEJA_ENVOYE' } });
        }
      }

      const avis = await prisma.$transaction(async (tx) => {
        const newAvis = await tx.avis.create({
          data: {
            id_evaluateur,
            id_evalue,
            id_trajet:   id_trajet   ?? null,
            id_location: id_location ?? null,
            note:        parseInt(note),
            commentaire: commentaire ?? null,
          }
        });

        // Recalculer la note moyenne de l'évalué
        const moyenne = await tx.avis.aggregate({
          where: { id_evalue },
          _avg: { note: true }
        });

        await tx.utilisateur.update({
          where: { id_utilisateur: id_evalue },
          data: { note_moyenne: moyenne._avg.note }
        });

        // Les réponses VTC lisent les notes dans les profils spécialisés.
        const moyenneValeur = moyenne._avg.note;
        const chauffeur = await tx.chauffeur.findUnique({ where: { id_chauffeur: id_evalue }, select: { id_chauffeur: true } });
        if (chauffeur) {
          await tx.chauffeur.update({ where: { id_chauffeur: id_evalue }, data: { note_chauffeur: moyenneValeur } });
        }
        const passager = await tx.passager.findUnique({ where: { id_passager: id_evalue }, select: { id_passager: true } });
        if (passager) {
          await tx.passager.update({ where: { id_passager: id_evalue }, data: { note_passager: moyenneValeur } });
        }
        const proprietaire = await tx.proprietaire.findUnique({ where: { id_proprietaire: id_evalue }, select: { id_proprietaire: true } });
        if (proprietaire) {
          await tx.proprietaire.update({ where: { id_proprietaire: id_evalue }, data: { note_proprietaire: moyenneValeur } });
        }

        return newAvis;
      });

      return res.status(201).json({ success: true, data: avis });
    } catch (error) {
      console.error('[avis.creer]', error);
      if (error.code === 'P2002') {
        return res.status(409).json({ success: false, message: 'Vous avez déjà envoyé un avis pour cet élément.', errors: { code: 'AVIS_DEJA_ENVOYE' } });
      }
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Note moyenne d'un utilisateur ──────────────────────────
  async noteMoyenne(req, res) {
    try {
      const { id } = req.params;

      const result = await prisma.avis.aggregate({
        where: { id_evalue: id },
        _avg:   { note: true },
        _count: { note: true }
      });

      return res.status(200).json({
        success: true,
        data: {
          note_moyenne: result._avg.note  ?? null,
          nb_avis:      result._count.note ?? 0,
        }
      });
    } catch (error) {
      console.error('[avis.noteMoyenne]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },
};


module.exports = AvisController ;
