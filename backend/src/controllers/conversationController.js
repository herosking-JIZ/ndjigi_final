/**
 * CONTROLLERS/CONVERSATIONCONTROLLER.JS
 * Gère les endpoints REST pour les conversations
 */

const { prisma } = require('../config/db');
const { isParticipant } = require('../socket/services/conversationService');

const ConversationController = {

  // ── GET /api/v1/conversations/:id/messages ─────────────────────
  // Récupère l'historique paginé des messages d'une conversation
  // BARRIÈRE STRICTE : utilisateur doit être participant
  async listerMessages(req, res) {
    try {
      const { id } = req.params;
      const idUtilisateur = req.user.id_utilisateur;

      // Conversion explicite des paramètres de pagination (req.query en strings)
      let page = parseInt(req.query.page, 10) || 1;
      let limit = parseInt(req.query.limit, 10) || 30;

      // Borne de sécurité : limiter à max 50 items par page
      if (limit > 50) limit = 50;

      // BARRIÈRE D'AUTORISATION (critique)
      const estParticipant = await isParticipant(id, idUtilisateur);
      if (!estParticipant) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé à cette conversation.',
          data: null,
          errors: null
        });
      }

      // Pagination
      const skip = (page - 1) * limit;

      // Récupérer les messages et le total en parallèle
      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where: { id_conversation: id },
          skip,
          take: limit,
          orderBy: { date_envoi: 'desc' }
        }),
        prisma.message.count({ where: { id_conversation: id } })
      ]);

      return res.status(200).json({
        success: true,
        message: 'Messages récupérés.',
        data: {
          messages,
          pagination: {
            total,
            page,
            limit
          }
        }
      });
    } catch (error) {
      console.error('[conversation.listerMessages]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur.',
        data: null,
        errors: error.message
      });
    }
  }
};

module.exports = ConversationController;
