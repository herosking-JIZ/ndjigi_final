/**
 * Configuration Redis singleton
 * Utilisé pour : token blacklist, rate limiting, OTP codes, etc.
 *
 * Usage:
 *   const { getRedisClient } = require('./redis');
 *   const redis = getRedisClient();
 *   await redis.set('key', 'value', 'EX', 300);
 */

const Redis = require('ioredis');

let redisClient = null;

/**
 * Crée ou retourne l'instance Redis
 */
function getRedisClient() {
  if (redisClient) return redisClient;

  const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

  redisClient = new Redis(REDIS_URL, {
    // Reconnect logic
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      if (times === 1) {
        console.log(`[Redis] Tentative de reconnexion...`);
      }
      return delay;
    },
    enableOfflineQueue: true,
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis connecté');
  });

  redisClient.on('error', (err) => {
    console.error('❌ Redis erreur:', err.message);
  });

  redisClient.on('close', () => {
    console.log('⚠️  Redis déconnecté');
  });

  return redisClient;
}

/**
 * Ferme la connexion Redis proprement
 */
async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('✅ Redis fermé');
  }
}

module.exports = {
  getRedisClient,
  closeRedis,
};
