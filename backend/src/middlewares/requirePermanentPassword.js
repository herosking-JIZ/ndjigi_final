/**
 * MIDDLEWARE/REQUIREPERMANENTPASSWORD.JS
 * Checks if user has a temporary password and blocks access to protected routes
 * Except for: /auth/change-temporary-password, /auth/logout, /auth/refresh
 */

const { prisma } = require('../config/db');

/**
 * Middleware to enforce permanent password requirement
 * Placed after authenticate middleware
 */
const requirePermanentPassword = async (req, res, next) => {
  try {
    const userId = req.user?.id_utilisateur;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise.',
        code: 'UNAUTHORIZED'
      });
    }

    // Fetch user's password flag
    const user = await prisma.utilisateur.findUnique({
      where: { id_utilisateur: userId },
      select: { mot_de_passe_temporaire: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable.',
        code: 'USER_NOT_FOUND'
      });
    }

    // If user has temporary password, block access (except for password change endpoints)
    if (user.mot_de_passe_temporaire === true) {
      const allowedPaths = [
        '/api/v1/auth/change-temporary-password',
        '/api/v1/auth/logout',
        '/api/v1/auth/refresh'
      ];

      const currentPath = req.baseUrl + req.path;
      const isAllowedPath = allowedPaths.some(path => currentPath.includes(path));

      if (!isAllowedPath) {
        return res.status(403).json({
          success: false,
          message: 'Vous devez changer votre mot de passe avant d\'accéder à cette ressource.',
          code: 'PASSWORD_CHANGE_REQUIRED'
        });
      }
    }

    next();
  } catch (error) {
    console.error('❌ requirePermanentPassword error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du mot de passe.',
      code: 'MIDDLEWARE_ERROR'
    });
  }
};

module.exports = requirePermanentPassword;
