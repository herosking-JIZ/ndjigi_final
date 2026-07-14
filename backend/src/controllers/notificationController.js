/**
 * CONTROLLERS/NOTIFICATIONCONTROLLER.JS
 */

const { prisma } = require('../config/db');

const NotificationController = {

  // ── Mes notifications ───────────────────────────────────────
  async mesNotifications(req, res) {
    try {
      const id_utilisateur = req.user.id_utilisateur;
      const { lu, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = { id_utilisateur };
      if (lu !== undefined) where.lu = lu === 'true';

      const [notifications, total, non_lues] = await Promise.all([
        prisma.notification.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { date_creation: 'desc' }
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({ where: { id_utilisateur, lu: false } })
      ]);

      return res.status(200).json({
        success: true,
        data: notifications,
        meta: { total, non_lues, page: parseInt(page), limit: parseInt(limit) }
      });
    } catch (error) {
      console.error('[notification.mesNotifications]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Marquer comme lue ───────────────────────────────────────
  async marquerLue(req, res) {
    try {
      const { id } = req.params;
      const id_utilisateur = req.user.id_utilisateur;

      const notif = await prisma.notification.findUnique({
        where: { id_notification: id }
      });

      if (!notif || notif.id_utilisateur !== id_utilisateur) {
        return res.status(404).json({ success: false, message: 'Notification introuvable.' });
      }

      const updated = await prisma.notification.update({
        where: { id_notification: id },
        data: { lu: true, date_lecture: new Date() }
      });

      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error('[notification.marquerLue]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Marquer toutes comme lues ───────────────────────────────
  async marquerToutesLues(req, res) {
    try {
      const id_utilisateur = req.user.id_utilisateur;

      await prisma.notification.updateMany({
        where: { id_utilisateur, lu: false },
        data: { lu: true, date_lecture: new Date() }
      });

      return res.status(200).json({ success: true, message: 'Toutes les notifications marquées comme lues.' });
    } catch (error) {
      console.error('[notification.marquerToutesLues]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Envoyer une notification (usage interne / admin) ────────
  async envoyer(req, res) {
    try {
      const { id_utilisateur, type, titre, contenu, id_objet_lie } = req.body;

      if (!id_utilisateur || !type || !titre || !contenu) {
        return res.status(400).json({ success: false, message: 'Champs obligatoires manquants.' });
      }

      const notification = await prisma.notification.create({
        data: {
          id_utilisateur,
          type,
          titre,
          contenu,
          id_objet_lie: id_objet_lie ?? null,
        }
      });

      return res.status(201).json({ success: true, data: notification });
    } catch (error) {
      console.error('[notification.envoyer]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Supprimer une notification ──────────────────────────────
  async supprimer(req, res) {
    try {
      const { id } = req.params;
      const id_utilisateur = req.user.id_utilisateur;

      const notif = await prisma.notification.findUnique({
        where: { id_notification: id }
      });

      if (!notif || notif.id_utilisateur !== id_utilisateur) {
        return res.status(404).json({ success: false, message: 'Notification introuvable.' });
      }

      await prisma.notification.delete({ where: { id_notification: id } });

      return res.status(200).json({ success: true, message: 'Notification supprimée.' });
    } catch (error) {
      console.error('[notification.supprimer]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },
};

module.exports = NotificationController;
