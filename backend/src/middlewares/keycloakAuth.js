/**
 * MIDDLEWARES/KEYCLOAKAUTH.JS
 * Adaptateur Express pour l'authentification Keycloak
 *
 * Utilise le service centralisé resolveUserFromToken() qui:
 *  1. Valide le token via JWKS/RS256 (signature sûre)
 *  2. Vérifie la blacklist Redis (logout)
 *  3. Résout l'utilisateur avec cache + auto-provisioning
 *  4. Applique les checks de compte
 *  5. Mappe les rôles Keycloak
 *
 * Ce middleware mappe les erreurs typées vers les bons codes HTTP
 */

const { resolveUserFromToken, AuthError } = require('../services/auth/resolveUser');

const keycloakAuth = async (req, res, next) => {
  try {
    // Récupérer le token depuis Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant. Connectez-vous.',
        code: 'NO_TOKEN'
      });
    }

    // Extraire le token brut (gère "Bearer " et doubles "Bearer Bearer")
    let token = authHeader;
    if (token.startsWith('Bearer ')) {
      token = token.substring(7); // Remove "Bearer "
    }

    // Résoudre l'utilisateur via le service d'auth centralisé
    const { user, roles, keycloak_id, payload } = await resolveUserFromToken(token);

    // Attacher l'utilisateur à la requête pour les middlewares suivants
    req.user = {
      ...user,
      id_utilisateur: user.id_utilisateur,
      keycloak_id,
      roles,
      auth_provider: 'keycloak',
      utilisateur_role: user.utilisateur_role,
      token // Garder le token pour les appels Admin API
    };

    next();

  } catch (err) {
    // Mapper les erreurs typées vers les bons codes HTTP
    if (err instanceof AuthError) {
      console.error(`❌ Auth error: ${err.code} - ${err.message}`);

      // Déterminer le code HTTP en fonction du code d'erreur
      let statusCode = 401; // Par défaut
      if (err.code === 'ACCOUNT_PENDING_ACTIVATION') {
        statusCode = 403;
      } else if (err.code === 'PHONE_NUMBER_REQUIRED') {
        statusCode = 422;
      } else if (err.code === 'ACCOUNT_BLOCKED') {
        statusCode = 401;
      }

      const response = {
        success: false,
        message: err.message,
        code: err.code
      };

      // Ajouter keycloak_data pour PHONE_NUMBER_REQUIRED
      if (err.details && err.details.keycloak_data) {
        response.keycloak_data = err.details.keycloak_data;
      }

      return res.status(statusCode).json(response);
    }

    // Erreur interne (non-AuthError)
    console.error('❌ keycloakAuth error:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur d\'authentification serveur.',
      code: 'AUTH_ERROR'
    });
  }
};

module.exports = { keycloakAuth };
