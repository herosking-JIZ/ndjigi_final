const { prisma } = require('../config/db')
const GestionnaireService = require('../services/gestionnaireService')
const keycloakService = require('../services/keycloakService')
const bcrypt = require('bcryptjs')
const rateLimit = require('express-rate-limit')

const InvitationController = {
  /**
   * GET /auth/verify-invitation?token=XXX
   * Verify invitation token is valid (public route)
   */
  async verifyToken(req, res) {
    try {
      const { token } = req.query

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token requis.',
          data: null,
          errors: null
        })
      }

      const result = await GestionnaireService.verifyToken(token)

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Lien invalide ou expiré',
          data: null,
          errors: null
        })
      }

      res.status(200).json({
        success: true,
        message: null,
        data: result,
        errors: null
      })
    } catch (error) {
      console.error('❌ Verify invitation error:', error.message)
      res.status(404).json({
        success: false,
        message: 'Lien invalide ou expiré',
        data: null,
        errors: null
      })
    }
  },

  /**
   * POST /auth/complete-first-connection
   * Complete account activation (set password) (public route)
   * Syncs password to Keycloak (source of truth for authentication)
   * Rate limited: 5 attempts per 15 min per token
   */
  async completeFirstConnection(req, res) {
    try {
      const { token, email, nouveau_mot_de_passe, accepte_conditions } = req.body

      if (!accepte_conditions) {
        return res.status(400).json({
          success: false,
          message: 'Vous devez accepter les conditions.',
          data: null,
          errors: [{ field: 'accepte_conditions', message: 'Requis', type: 'boolean.required' }]
        })
      }

      // Find user by token
      const user = await prisma.utilisateur.findFirst({
        where: {
          invitation_token: token,
          invitation_token_expire: { gt: new Date() },
          email: email
        }
      })

      if (!user || user.invitation_used_at) {
        return res.status(404).json({
          success: false,
          message: 'Lien invalide ou expiré',
          data: null,
          errors: null
        })
      }

      // 1️⃣ Sync password to Keycloak (source of truth for authentication)

      // 1️⃣ Sync password to Keycloak (source of truth for authentication)
if (user.keycloak_id) {
  try {
    await keycloakService.adminAPI.users.resetPassword({
      realm: process.env.KEYCLOAK_REALM,
      id: user.keycloak_id,
      credential: {
        temporary: false,
        type: 'password',
        value: nouveau_mot_de_passe
      }
    })

    // ✅ Lever les required actions satisfaites par CE flow (gestionnaire/admin)
    const kcUser = await keycloakService.adminAPI.users.findOne({
      realm: process.env.KEYCLOAK_REALM,
      id: user.keycloak_id
    })

    const actionsResolvedByThisFlow = ['UPDATE_PASSWORD', 'VERIFY_EMAIL', 'TERMS_AND_CONDITIONS']
    const remainingActions = (kcUser.requiredActions || []).filter(
      a => !actionsResolvedByThisFlow.includes(a)
    )

    await keycloakService.adminAPI.users.update(
      { realm: process.env.KEYCLOAK_REALM, id: user.keycloak_id },
      {
        enabled: true,
        emailVerified: true,
        requiredActions: remainingActions
      }
    )

    console.log(JSON.stringify({
      event: 'keycloak_password_reset',
      user_id: user.id_utilisateur,
      keycloak_id: user.keycloak_id,
      timestamp: new Date().toISOString()
    }))
  } catch (kcError) {
    console.error(JSON.stringify({
      event: 'keycloak_password_reset_failed',
      user_id: user.id_utilisateur,
      keycloak_id: user.keycloak_id,
      error: kcError.message,
      timestamp: new Date().toISOString()
    }))
    // Non-blocking: log the error but continue with local password storage
  }
}
      // 2️⃣ Hash and store password locally (for audit/fallback)
      const hashedPassword = await bcrypt.hash(nouveau_mot_de_passe, 10)

      // 3️⃣ Update user (transaction to ensure atomicity)
      const updated = await prisma.$transaction(async (tx) => {
        return tx.utilisateur.update({
          where: { id_utilisateur: user.id_utilisateur },
          data: {
            mot_de_passe_hash: hashedPassword,
            statut_compte: 'actif',
            invitation_token: null,
            invitation_token_expire: null,
            invitation_used_at: new Date(),
            invitation_resend_count: 0,
            tentatives_connexion: 0,
            bloque_jusqu_au: null
          }
        })
      })

      console.log(JSON.stringify({
        event: 'first_connection_completed',
        user_id: user.id_utilisateur,
        email: email,
        keycloak_id: user.keycloak_id,
        timestamp: new Date().toISOString()
      }))

      res.status(200).json({
        success: true,
        message: 'Compte activé. Veuillez vous connecter.',
        data: {
          id_utilisateur: updated.id_utilisateur,
          email: updated.email,
          statut_compte: updated.statut_compte
        },
        errors: null
      })
    } catch (error) {
      console.error('❌ Complete first connection error:', error.message)
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de l\'activation.',
        data: null,
        errors: null
      })
    }
  },

  /**
   * POST /auth/resend-invitation
   * Resend invitation email (admin only)
   */
  async resendInvitation(req, res) {
    try {
      const { id_utilisateur } = req.body

      const result = await GestionnaireService.resendInvitation(id_utilisateur)

      res.status(200).json({
        success: true,
        message: 'Email d\'invitation renvoyé.',
        data: result,
        errors: null
      })
    } catch (error) {
      if (error.code === 'USER_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur introuvable.',
          data: null,
          errors: { code: 'USER_NOT_FOUND' }
        })
      }
      if (error.code === 'ALREADY_ACTIVATED') {
        return res.status(400).json({
          success: false,
          message: 'Cet utilisateur a déjà activé son compte.',
          data: null,
          errors: { code: 'ALREADY_ACTIVATED' }
        })
      }
      if (error.code === 'RESEND_LIMIT_EXCEEDED') {
        return res.status(429).json({
          success: false,
          message: 'Limite de renvois atteinte (3 max).',
          data: null,
          errors: { code: 'RESEND_LIMIT_EXCEEDED' }
        })
      }

      console.error('❌ Resend invitation error:', error.message)
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors du renvoi.',
        data: null,
        errors: null
      })
    }
  }
}

module.exports = InvitationController
