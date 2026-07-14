/**
 * SOCKET/MIDDLEWARE/AUTHMIDDLEWARE.JS
 * Middleware Socket.io pour authentifier les connexions
 *
 * Réutilise resolveUserFromToken() (service d'auth centralisé)
 * Attache les données utilisateur à socket.data
 * Propage les codes d'erreur typés (NO_TOKEN, INVALID_TOKEN, etc.)
 */

const { resolveUserFromToken, AuthError } = require('../../services/auth/resolveUser');

/**
 * Middleware Socket.io d'authentification
 * @param {Socket} socket - Socket.io connection
 * @param {Function} next - Callback pour chaîner les middlewares
 */
const authMiddleware = async (socket, next) => {
  try {
    // Récupérer le token depuis socket.handshake.auth.token
    // resolveUserFromToken gère déjà le strip "Bearer" si nécessaire
    const token = socket.handshake.auth.token;

    if (!token) {
      const err = new Error('NO_TOKEN');
      err.data = { code: 'NO_TOKEN' };
      return next(err);
    }

    // Résoudre l'utilisateur via le service centralisé
    const { user, roles, keycloak_id } = await resolveUserFromToken(token);

    // Attacher les données utilisateur à socket.data
    socket.data.user = {
      id_utilisateur: user.id_utilisateur,
      keycloak_id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      roles
    };
    socket.data.roles = roles;
    socket.data.keycloak_id = keycloak_id;

    next();

  } catch (err) {
    // Mapper AuthError vers Socket.io error avec code
    if (err instanceof AuthError) {
      const socketErr = new Error(err.message);
      socketErr.data = { code: err.code || 'UNAUTHORIZED' };
      return next(socketErr);
    }

    // Erreur interne (non-AuthError)
    const socketErr = new Error('UNAUTHORIZED');
    socketErr.data = { code: 'UNAUTHORIZED' };
    return next(socketErr);
  }
};

module.exports = { authMiddleware };
