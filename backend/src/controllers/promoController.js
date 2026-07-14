// controllers/promoController.js
const { prisma } = require('../config/db');

const PromoController = {

  async lister(req, res) {
    try {
      let { actif, page, limit } = req.query;

      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;
      const skip = (pageNum - 1) * limitNum;

      const where = {};
      if (actif !== undefined) {
        // En fonction du validateur, actif peut être une chaîne "true"/"false" ou déjà un booléen
        where.actif = (typeof actif === 'string') ? (actif === 'true') : actif;
      }

      const [promos, total] = await Promise.all([
        prisma.code_promo.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { date_debut: 'desc' }
        }),
        prisma.code_promo.count({ where })
      ]);

      return res.status(200).json({
        success: true,
        message: 'Codes promo récupérés.',
        data: promos,
        meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
        errors: null
      });
    } catch (error) {
      console.error('[promo.lister]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.', data: null, errors: error.message });
    }
  },

  async creer(req, res) {
    try {
      // req.body déjà validé et transformé par Joi (code en uppercase, valeur en number...)
      const { code, type_reduction, valeur, date_debut, date_fin, nb_utilisations_max, actif } = req.body;

      const promo = await prisma.code_promo.create({
        data: { code, type_reduction, valeur, date_debut, date_fin: date_fin ?? null, nb_utilisations_max: nb_utilisations_max ?? null, actif }
      });

      return res.status(201).json({ success: true, message: 'Code promo créé.', data: promo, errors: null });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ success: false, message: 'Ce code promo existe déjà.', data: null, errors: null });
      }
      console.error('[promo.creer]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.', data: null, errors: error.message });
    }
  },

  async modifier(req, res) {
    try {
      const { id } = req.params;
      const promo = await prisma.code_promo.update({
        where: { id_promo: id },
        data: req.body
      });
      return res.status(200).json({ success: true, message: 'Code promo mis à jour.', data: promo, errors: null });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, message: 'Code promo introuvable.', data: null, errors: null });
      }
      console.error('[promo.modifier]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.', data: null, errors: error.message });
    }
  },

  async toggleActif(req, res) {
    try {
      const { id } = req.params;
      const promo = await prisma.code_promo.findUnique({ where: { id_promo: id } });
      if (!promo) {
        return res.status(404).json({ success: false, message: 'Code promo introuvable.', data: null, errors: null });
      }
      const updated = await prisma.code_promo.update({
        where: { id_promo: id },
        data: { actif: !promo.actif }
      });
      return res.status(200).json({ success: true, message: `Code promo ${updated.actif ? 'activé' : 'désactivé'}.`, data: updated, errors: null });
    } catch (error) {
      console.error('[promo.toggleActif]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.', data: null, errors: error.message });
    }
  },

  async valider(req, res) {
    try {
      const { code } = req.params;
      const id_utilisateur = req.user.id_utilisateur;

      const promo = await prisma.code_promo.findUnique({ where: { code: code.toUpperCase() } });

      if (!promo || !promo.actif)
        return res.status(404).json({ success: false, message: 'Code promo invalide.', data: null, errors: null });
      if (new Date() < new Date(promo.date_debut))
        return res.status(400).json({ success: false, message: 'Code promo pas encore actif.', data: null, errors: null });
      if (promo.date_fin && new Date() > new Date(promo.date_fin))
        return res.status(400).json({ success: false, message: 'Code promo expiré.', data: null, errors: null });
      if (promo.nb_utilisations_max && promo.nb_utilisations_actuel >= promo.nb_utilisations_max)
        return res.status(400).json({ success: false, message: 'Code promo épuisé.', data: null, errors: null });

      const dejaUtilise = await prisma.utilisation_promo.findUnique({
        where: { id_utilisateur_id_promo: { id_utilisateur, id_promo: promo.id_promo } }
      });
      if (dejaUtilise)
        return res.status(400).json({ success: false, message: 'Vous avez déjà utilisé ce code.', data: null, errors: null });

      return res.status(200).json({
        success: true,
        message: 'Code promo valide.',
        data: { id_promo: promo.id_promo, code: promo.code, type_reduction: promo.type_reduction, valeur: promo.valeur },
        errors: null
      });
    } catch (error) {
      console.error('[promo.valider]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.', data: null, errors: error.message });
    }
  },
};

module.exports = PromoController;