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
      const { id_evalue, id_trajet, note, commentaire } = req.body;
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

      const avis = await prisma.$transaction(async (tx) => {
        const newAvis = await tx.avis.create({
          data: {
            id_evaluateur,
            id_evalue,
            id_trajet:   id_trajet   ?? null,
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

        return newAvis;
      });

      return res.status(201).json({ success: true, data: avis });
    } catch (error) {
      console.error('[avis.creer]', error);
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
