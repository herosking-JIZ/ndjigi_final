/**
 * SERVICES/AUTH/RESOLVEUSER.JS
 * Service d'authentification centralisé et sûr
 * Réutilisable hors d'Express (Socket.io, etc.)
 *
 * Valide le token via JWKS/RS256 (JAMAIS jwt.decode seul)
 * Résout l'utilisateur avec cache Redis et auto-provisioning
 */

const { verifyKeycloakToken } = require('../../config/keycloak');
const { getRedisClient } = require('../../config/redis');
const { prisma } = require('../../config/db');
const { getLocalRole } = require('../../constants/roles');
const { provisionPassagerBaseline, PhoneRequiredError } = require('../provisioning.service');

const redis = getRedisClient();

/**
 * Erreur typée pour authentification
 * Permet au middleware Express de mapper vers les bons codes HTTP
 */
class AuthError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'AuthError';
    this.code = code; // NO_TOKEN, INVALID_TOKEN, TOKEN_EXPIRED, TOKEN_REVOKED, etc.
    this.details = details; // Contexte additionnel (keycloak_data pour PHONE_NUMBER_REQUIRED)
  }
}

/**
 * Résout un utilisateur à partir d'un token brut
 * Valide le token, vérifie la blacklist, récupère/crée l'utilisateur
 *
 * @param {string} rawToken - Token JWT brut (peut avoir "Bearer " prefix)
 * @returns {Promise<object>} { user, roles, keycloak_id, payload }
 * @throws {AuthError} Avec code parmi: NO_TOKEN, INVALID_TOKEN, TOKEN_EXPIRED,
 *                     TOKEN_REVOKED, ACCOUNT_PENDING_ACTIVATION, ACCOUNT_BLOCKED,
 *                     PHONE_NUMBER_REQUIRED
 */
async function resolveUserFromToken(rawToken) {
  // ─── a. Nettoyer le token ───
  if (!rawToken) {
    throw new AuthError('Token manquant. Connectez-vous.', 'NO_TOKEN');
  }

  let token = rawToken.trim();
  // Gérer les doubles "Bearer " (frontend malformé)
  if (token.startsWith('Bearer ')) {
    token = token.replace(/^Bearer\s+/i, '').trim();
  }

  // ─── b. Vérifier la SIGNATURE via JWKS/RS256 (JAMAIS jwt.decode seul) ───
  let payload;
  try {
    payload = await verifyKeycloakToken(token);
  } catch (err) {
    const message = (err.message || '').toLowerCase();
    // Détecter les tokens expirés (contient "expired", "expir", ou erreur TokenExpiredError)
    if (message.includes('expired') || message.includes('expir') || err.name === 'TokenExpiredError') {
      throw new AuthError('Session expirée. Reconnectez-vous.', 'TOKEN_EXPIRED');
    }
    throw new AuthError('Token invalide ou expiré.', 'INVALID_TOKEN');
  }

  if (!payload || !payload.sub) {
    throw new AuthError('Token mal formé (sub manquant).', 'INVALID_TOKEN');
  }

  // ─── c. Vérifier la blacklist Redis (logout) ───
  const jti = payload.jti || payload.sub;
  const isBlacklisted = await redis.exists(`blacklist:${jti}`);
  if (isBlacklisted) {
    throw new AuthError('Token révoqué. Reconnectez-vous.', 'TOKEN_REVOKED');
  }

  // ─── d. Résoudre l'utilisateur (cache Redis + lookup BD + auto-provisioning) ───
  const cacheKey = `auth:user:${payload.sub}`;
  let user = null;

  // Essayer le cache Redis (TTL 60s)
  const cachedUser = await redis.get(cacheKey);
  if (cachedUser) {
    user = JSON.parse(cachedUser);
  } else {
    // Pas en cache → requête BD
    user = await prisma.utilisateur.findUnique({
      where: { keycloak_id: payload.sub },
      include: {
        utilisateur_role: { where: { actif: true } }
      }
    });

    // Si l'utilisateur n'existe pas par keycloak_id, chercher par email
    if (!user && payload.email) {
      user = await prisma.utilisateur.findUnique({
        where: { email: payload.email },
        include: {
          utilisateur_role: { where: { actif: true } }
        }
      });

      // Email existe → lier le compte Keycloak
      if (user) {
        console.log(`🔗 Liaison Keycloak: ${payload.email} (ID: ${user.id_utilisateur}) → keycloak_id=${payload.sub}`);
        user = await prisma.utilisateur.update({
          where: { id_utilisateur: user.id_utilisateur },
          data: { keycloak_id: payload.sub },
          include: {
            utilisateur_role: { where: { actif: true } }
          }
        });
      } else {
        // Aucun compte existant → auto-provisioning
        try {
          console.log(`✅ Création d'un nouvel utilisateur depuis Keycloak: ${payload.email}`);
          user = await prisma.$transaction((tx) => provisionPassagerBaseline(payload, tx));
        } catch (provisionError) {
          if (provisionError instanceof PhoneRequiredError) {
            throw new AuthError(
              'Numéro de téléphone requis.',
              'PHONE_NUMBER_REQUIRED',
              {
                keycloak_data: {
                  keycloak_id: payload.sub,
                  email: payload.email,
                  prenom: payload.given_name || '',
                  nom: payload.family_name || '',
                }
              }
            );
          }
          throw provisionError;
        }
      }
    }

    if (!user) {
      throw new AuthError('Utilisateur non trouvé.', 'INVALID_TOKEN');
    }

    // Cacher l'utilisateur en Redis (TTL 60s)
    await redis.setex(cacheKey, 60, JSON.stringify(user));
  }

  // ─── e. Appliquer les checks de compte ───
  if (user.statut_compte === 'en_attente_activation') {
    throw new AuthError(
      'Compte non activé. Veuillez accepter l\'invitation par email.',
      'ACCOUNT_PENDING_ACTIVATION'
    );
  }

  if (user.bloque_jusqu_au && user.bloque_jusqu_au > new Date()) {
    throw new AuthError(
      'Compte temporairement bloqué.',
      'ACCOUNT_BLOCKED'
    );
  }

  // ─── f. Mapper les rôles depuis realm_access.roles ───
  const keycloakRealmRoles = payload.realm_access?.roles || [];
  const roles = keycloakRealmRoles
    .map(kcRole => getLocalRole(kcRole))
    .filter(role => role !== null);

  // ─── g. Retourner le résultat ───
  const { mot_de_passe_hash, ...userSafe } = user;

  return {
    user: {
      ...userSafe,
      id_utilisateur: user.id_utilisateur,
    },
    roles,
    keycloak_id: payload.sub,
    payload, // Token payload complète (optionnel, pour debug/audit)
  };
}

module.exports = {
  resolveUserFromToken,
  AuthError,
};
