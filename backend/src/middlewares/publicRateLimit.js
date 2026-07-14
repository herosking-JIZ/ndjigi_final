/**
 * MIDDLEWARES/PUBLICRATELIMIT.JS
 * Rate limiting for public share endpoints
 */

const rateLimit = require('express-rate-limit');

// Static trajet data: 30 requests/minute per IP
const publicTokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Trop de requêtes. Réessayez dans un moment.',
    errors: { code: 'RATE_LIMIT_EXCEEDED' }
  }
});

// Live position: 12 requests/minute per IP (= 1 request every 5 seconds)
const publicPositionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  message: {
    success: false,
    message: 'Trop de requêtes. Réessayez dans un moment.',
    errors: { code: 'RATE_LIMIT_EXCEEDED' }
  }
});

module.exports = { publicTokenLimiter, publicPositionLimiter };
