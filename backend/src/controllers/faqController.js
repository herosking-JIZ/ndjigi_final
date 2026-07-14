/**
 * CONTROLLERS/FAQCONTROLLER.JS
 * FAQ management endpoints
 */

const { prisma } = require('../config/db');

const FaqController = {
  // ── POST /faqs — Créer une FAQ ──────────────────────────
  async create(req, res) {
    try {
      const { question, reponse, categorie, ordre, isActive } = req.body;

      const faq = await prisma.faq.create({
        data: {
          question,
          reponse,
          categorie: categorie ?? null,
          ordre: ordre ?? 0,
          isActive: isActive ?? true,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'FAQ créée avec succès.',
        data: faq,
      });
    } catch (error) {
      console.error('[faq.create]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        errors: { code: 'INTERNAL_ERROR', details: error.message },
      });
    }
  },

  // ── GET /faqs — Lister toutes les FAQs ──────────────────
  async list(req, res) {
    try {
      const { page = 1, limit = 20, categorie, isActive } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = { deletedAt: null };
      if (categorie) where.categorie = categorie;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const [faqs, total] = await Promise.all([
        prisma.faq.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: [{ ordre: 'asc' }, { createdAt: 'desc' }],
        }),
        prisma.faq.count({ where }),
      ]);

      return res.status(200).json({
        success: true,
        data: faqs,
        meta: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('[faq.list]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        errors: { code: 'INTERNAL_ERROR', details: error.message },
      });
    }
  },

  // ── GET /faqs/:id — Récupérer une FAQ ───────────────────
  async getById(req, res) {
    try {
      const { id } = req.params;

      const faq = await prisma.faq.findUnique({
        where: { id_faq: id },
      });

      if (!faq || faq.deletedAt) {
        return res.status(404).json({
          success: false,
          message: 'FAQ introuvable.',
          errors: { code: 'FAQ_NOT_FOUND' },
        });
      }

      // Incrémenter viewCount (fire & forget)
      prisma.faq
        .update({
          where: { id_faq: id },
          data: { viewCount: { increment: 1 } },
        })
        .catch((err) => console.error('[faq.viewCount]', err));

      return res.status(200).json({
        success: true,
        data: faq,
      });
    } catch (error) {
      console.error('[faq.getById]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        errors: { code: 'INTERNAL_ERROR', details: error.message },
      });
    }
  },

  // ── PATCH /faqs/:id — Mettre à jour une FAQ ─────────────
  async update(req, res) {
    try {
      const { id } = req.params;
      const { question, reponse, categorie, ordre, isActive } = req.body;

      const faq = await prisma.faq.findUnique({ where: { id_faq: id } });

      if (!faq || faq.deletedAt) {
        return res.status(404).json({
          success: false,
          message: 'FAQ introuvable.',
          errors: { code: 'FAQ_NOT_FOUND' },
        });
      }

      const updated = await prisma.faq.update({
        where: { id_faq: id },
        data: {
          ...(question && { question }),
          ...(reponse && { reponse }),
          ...(categorie !== undefined && { categorie }),
          ...(ordre !== undefined && { ordre }),
          ...(isActive !== undefined && { isActive }),
        },
      });

      return res.status(200).json({
        success: true,
        message: 'FAQ mise à jour.',
        data: updated,
      });
    } catch (error) {
      console.error('[faq.update]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        errors: { code: 'INTERNAL_ERROR', details: error.message },
      });
    }
  },

  // ── DELETE /faqs/:id — Supprimer une FAQ ────────────────
  async delete(req, res) {
    try {
      const { id } = req.params;

      const faq = await prisma.faq.findUnique({ where: { id_faq: id } });

      if (!faq || faq.deletedAt) {
        return res.status(404).json({
          success: false,
          message: 'FAQ introuvable.',
          errors: { code: 'FAQ_NOT_FOUND' },
        });
      }

      await prisma.faq.update({
        where: { id_faq: id },
        data: { deletedAt: new Date() },
      });

      return res.status(200).json({
        success: true,
        message: 'FAQ supprimée.',
      });
    } catch (error) {
      console.error('[faq.delete]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        errors: { code: 'INTERNAL_ERROR', details: error.message },
      });
    }
  },

  // ── GET /faqs/search?q=... — Rechercher des FAQs ────────
  async search(req, res) {
    try {
      const { q, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {
        deletedAt: null,
        isActive: true,
        OR: [
          { question: { contains: q, mode: 'insensitive' } },
          { reponse: { contains: q, mode: 'insensitive' } },
        ],
      };

      const [faqs, total] = await Promise.all([
        prisma.faq.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: [{ ordre: 'asc' }, { createdAt: 'desc' }],
        }),
        prisma.faq.count({ where }),
      ]);

      return res.status(200).json({
        success: true,
        data: faqs,
        meta: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
          query: q,
        },
      });
    } catch (error) {
      console.error('[faq.search]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        errors: { code: 'INTERNAL_ERROR', details: error.message },
      });
    }
  },

  // ── PATCH /faqs/reorder — Réordonner les FAQs ───────────
  async reorder(req, res) {
    try {
      const { faqs } = req.body;

      await prisma.$transaction(
        faqs.map((item) =>
          prisma.faq.update({
            where: { id_faq: item.id_faq },
            data: { ordre: item.ordre },
          })
        )
      );

      return res.status(200).json({
        success: true,
        message: 'FAQs réordonnées.',
      });
    } catch (error) {
      console.error('[faq.reorder]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        errors: { code: 'INTERNAL_ERROR', details: error.message },
      });
    }
  },

  // ── GET /faqs/stats — Statistiques des FAQs ─────────────
  async stats(req, res) {
    try {
      const [total, active, byCategory, mostViewed, mostHelpful] = await Promise.all([
        prisma.faq.count({ where: { deletedAt: null } }),
        prisma.faq.count({ where: { deletedAt: null, isActive: true } }),
        prisma.faq.groupBy({
          by: ['categorie'],
          where: { deletedAt: null },
          _count: true,
        }),
        prisma.faq.findMany({
          where: { deletedAt: null },
          orderBy: { viewCount: 'desc' },
          take: 5,
          select: { id_faq: true, question: true, viewCount: true },
        }),
        prisma.faq.findMany({
          where: { deletedAt: null },
          orderBy: { helpfulCount: 'desc' },
          take: 5,
          select: { id_faq: true, question: true, helpfulCount: true, notHelpfulCount: true },
        }),
      ]);

      const categorieStats = byCategory.map((cat) => ({
        categorie: cat.categorie || 'Sans catégorie',
        count: cat._count,
      }));

      return res.status(200).json({
        success: true,
        data: {
          total,
          active,
          byCategory: categorieStats,
          mostViewed,
          mostHelpful,
        },
      });
    } catch (error) {
      console.error('[faq.stats]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        errors: { code: 'INTERNAL_ERROR', details: error.message },
      });
    }
  },

  // ── PATCH /faqs/:id/vote/helpful — Voter utile ─────────
  async voteHelpful(req, res) {
    try {
      const { id } = req.params;

      const faq = await prisma.faq.findUnique({ where: { id_faq: id } });

      if (!faq || faq.deletedAt) {
        return res.status(404).json({
          success: false,
          message: 'FAQ introuvable.',
          errors: { code: 'FAQ_NOT_FOUND' },
        });
      }

      const updated = await prisma.faq.update({
        where: { id_faq: id },
        data: { helpfulCount: { increment: 1 } },
      });

      return res.status(200).json({
        success: true,
        message: 'Vote enregistré.',
        data: { helpful: updated.helpfulCount },
      });
    } catch (error) {
      console.error('[faq.voteHelpful]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        errors: { code: 'INTERNAL_ERROR', details: error.message },
      });
    }
  },

  // ── PATCH /faqs/:id/vote/not-helpful — Voter non-utile ─
  async voteNotHelpful(req, res) {
    try {
      const { id } = req.params;

      const faq = await prisma.faq.findUnique({ where: { id_faq: id } });

      if (!faq || faq.deletedAt) {
        return res.status(404).json({
          success: false,
          message: 'FAQ introuvable.',
          errors: { code: 'FAQ_NOT_FOUND' },
        });
      }

      const updated = await prisma.faq.update({
        where: { id_faq: id },
        data: { notHelpfulCount: { increment: 1 } },
      });

      return res.status(200).json({
        success: true,
        message: 'Vote enregistré.',
        data: { notHelpful: updated.notHelpfulCount },
      });
    } catch (error) {
      console.error('[faq.voteNotHelpful]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        errors: { code: 'INTERNAL_ERROR', details: error.message },
      });
    }
  },
};

module.exports = FaqController;
