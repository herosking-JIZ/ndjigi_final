/**
 * SOCKET/SERVICES/PRESENCESERVICE.JS
 * Gère la présence en ligne des utilisateurs via Redis (DB /0)
 * Comptage multi-socket : un user peut avoir N sockets, marquer offline QUE quand le dernier se déconnecte
 */

const { getRedisClient } = require('../../config/redis');

const PRESENCE_TTL = 90; // secondes (fraîcheur du compteur)

/**
 * Ajoute une socket pour un utilisateur
 * @param {string} idUtilisateur - UUID de l'utilisateur
 * @returns {Promise<Object>} { count: nombre total de sockets pour cet user }
 */
async function addSocket(idUtilisateur) {
  try {
    const redis = getRedisClient();
    const key = `presence:count:${idUtilisateur}`;

    // INCR le compteur et récupérer la nouvelle valeur
    const count = await redis.incr(key);

    // Poser/rafraîchir un TTL pour éviter les compteurs fantômes
    await redis.expire(key, PRESENCE_TTL);

    return { count };
  } catch (err) {
    console.error(`❌ Erreur addSocket: ${err.message}`);
    // Retourner une valeur neutre pour éviter un crash
    return { count: 1 };
  }
}

/**
 * Retire une socket pour un utilisateur
 * @param {string} idUtilisateur - UUID de l'utilisateur
 * @returns {Promise<Object>} { count: nombre de sockets restantes (≤ 0 → offline) }
 */
async function removeSocket(idUtilisateur) {
  try {
    const redis = getRedisClient();
    const key = `presence:count:${idUtilisateur}`;

    // DECR le compteur
    const count = await redis.decr(key);

    // Si le compteur <= 0, supprimer la clé pour nettoyer
    if (count <= 0) {
      await redis.del(key);
    }

    return { count };
  } catch (err) {
    console.error(`❌ Erreur removeSocket: ${err.message}`);
    // Retourner une valeur neutre (considérer offline)
    return { count: 0 };
  }
}

/**
 * Rafraîchit le TTL de présence (heartbeat)
 * @param {string} idUtilisateur - UUID de l'utilisateur
 * @returns {Promise<void>}
 */
async function refresh(idUtilisateur) {
  try {
    const redis = getRedisClient();
    const key = `presence:count:${idUtilisateur}`;

    // Rafraîchir le TTL
    await redis.expire(key, PRESENCE_TTL);
  } catch (err) {
    console.error(`❌ Erreur refresh: ${err.message}`);
    // Silent fail pour heartbeat
  }
}

/**
 * Vérifie si un utilisateur est en ligne
 * @param {string} idUtilisateur - UUID de l'utilisateur
 * @returns {Promise<boolean>} true si en ligne, false sinon
 */
async function isOnline(idUtilisateur) {
  try {
    const redis = getRedisClient();
    const key = `presence:count:${idUtilisateur}`;

    const exists = await redis.exists(key);
    return exists === 1;
  } catch (err) {
    console.error(`❌ Erreur isOnline: ${err.message}`);
    return false;
  }
}

module.exports = {
  addSocket,
  removeSocket,
  refresh,
  isOnline
};
