/**
 * SOCKET/SERVICES/RATELIMITSERVICE.JS
 * Gère le rate limiting par utilisateur et par événement via Redis (DB /0)
 * Algorithme : fenêtre fixe (fixed window)
 */

const { getRedisClient } = require('../../config/redis');

// Limites par événement (max, window en secondes)
const LIMITS = {
  'message:send': { max: 10, window: 10 },
  'conversation:join': { max: 20, window: 10 },
  'message:read': { max: 20, window: 10 },
  'typing': { max: 30, window: 10 }
};

/**
 * Vérifie le rate limit pour un événement
 * @param {string} event - Nom de l'événement (ex. 'message:send')
 * @param {string} idUtilisateur - UUID de l'utilisateur
 * @param {number} max - Nombre maximum d'occurrences
 * @param {number} windowSeconds - Durée de la fenêtre en secondes
 * @returns {Promise<Object>} { allowed: boolean, count: nombre d'occurrences dans la fenêtre }
 */
async function checkRateLimit(event, idUtilisateur, max, windowSeconds) {
  try {
    const redis = getRedisClient();
    const key = `ratelimit:${event}:${idUtilisateur}`;

    // Incrémenter le compteur
    const count = await redis.incr(key);

    // Si c'est la première occurrrence, poser le TTL pour la fenêtre
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }

    // Retourner si autorisé (count <= max)
    return {
      allowed: count <= max,
      count
    };
  } catch (err) {
    // FAIL-OPEN : en cas d'erreur Redis, ne pas bloquer les utilisateurs légitimes
    console.error(`❌ Erreur rate limit (${event}): ${err.message}`);
    return {
      allowed: true,  // Autoriser si Redis échoue
      count: 0
    };
  }
}

module.exports = {
  checkRateLimit,
  LIMITS
};
