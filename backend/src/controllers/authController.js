/**
 * CONTROLLERS/AUTH CONTROLLER.JS
 * Local email/password authentication (for gestionnaires and other local users)
 */

const { prisma } = require('../config/db');
const { getRedisClient } = require('../config/redis');
const redis = getRedisClient();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const AuthController = {
  /**
   * POST /api/v1/auth/local/login
   * Authenticate with email and password (bcrypt-based)
   * Used by: gestionnaires, admins, and other local users
   */
  async localLogin(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email et mot de passe requis.',
          code: 'MISSING_FIELDS'
        });
      }

      // Find user by email
      const user = await prisma.utilisateur.findUnique({
        where: { email },
        include: { utilisateur_role: { where: { actif: true } } }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect.',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Verify password with bcrypt
      const isPasswordValid = user.mot_de_passe_hash
        ? await bcrypt.compare(password, user.mot_de_passe_hash)
        : false;

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect.',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Check if account is active
      if (user.supprime_le) {
        return res.status(403).json({
          success: false,
          message: 'Ce compte a été supprimé.',
          code: 'ACCOUNT_DELETED'
        });
      }

      const localRoles = (user.utilisateur_role || []).map((ur) => ur.role);

      // Generate JWT tokens
      const accessToken = jwt.sign(
        {
          sub: user.id_utilisateur,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          roles: localRoles.length > 0 ? localRoles : ['passager'],
          auth_provider: 'email'
        },
        process.env.JWT_SECRET || 'change_this_secret_key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
      );

      const refreshToken = jwt.sign(
        { sub: user.id_utilisateur },
        process.env.JWT_REFRESH_SECRET || 'change_this_refresh_secret',
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
      );

      return res.json({
        success: true,
        message: 'Connexion réussie.',
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: '15m',
          token_type: 'Bearer',
          mot_de_passe_temporaire: user.mot_de_passe_temporaire || false,
          user: {
            id_utilisateur: user.id_utilisateur,
            email: user.email,
            nom: user.nom,
            prenom: user.prenom,
            numero_telephone: user.numero_telephone,
            photo_profil: user.photo_profil,
            roles: localRoles.length > 0 ? localRoles : ['passager'],
            auth_provider: 'email'
          }
        }
      });
    } catch (error) {
      console.error('❌ Local login error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la connexion.',
        code: 'LOGIN_ERROR'
      });
    }
  },

  
  /**
   * POST /api/v1/auth/change-temporary-password
   * Change temporary password to permanent password
   * Requires: Bearer token (authenticated user)
   * Body: { ancien_mot_de_passe, nouveau_mot_de_passe }
   */
  async changeTemporaryPassword(req, res) {
    try {
      const userId = req.user?.id_utilisateur;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentification requise.',
          code: 'UNAUTHORIZED'
        });
      }

      const { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;

      if (!ancien_mot_de_passe || !nouveau_mot_de_passe) {
        return res.status(400).json({
          success: false,
          message: 'Ancien et nouveau mot de passe requis.',
          code: 'MISSING_FIELDS'
        });
      }

      // Retrieve user
      const user = await prisma.utilisateur.findUnique({
        where: { id_utilisateur: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur introuvable.',
          code: 'USER_NOT_FOUND'
        });
      }

      // Verify old password
      const isOldPasswordValid = user.mot_de_passe_hash
        ? await bcrypt.compare(ancien_mot_de_passe, user.mot_de_passe_hash)
        : false;

      if (!isOldPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Mot de passe actuel incorrect.',
          code: 'INVALID_OLD_PASSWORD'
        });
      }

      // Validate new password (12+ chars, uppercase, lowercase, digit, special char)
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
      if (!passwordRegex.test(nouveau_mot_de_passe)) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.',
          code: 'INVALID_PASSWORD_FORMAT'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(nouveau_mot_de_passe, 10);

      // Update user: set permanent password and clear temporary flag
      await prisma.utilisateur.update({
        where: { id_utilisateur: userId },
        data: {
          mot_de_passe_hash: hashedPassword,
          mot_de_passe_temporaire: false
        }
      });

      console.log(`✅ [PASSWORD_CHANGED] user=${userId}`);

      res.json({
        success: true,
        message: 'Mot de passe changé avec succès.',
        data: {
          id_utilisateur: userId
        }
      });
    } catch (error) {
      console.error('❌ Change password error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du changement de mot de passe.',
        code: 'PASSWORD_CHANGE_ERROR'
      });
    }
  }
};

module.exports = AuthController;
