const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

// 20 uploads max per 15 minutes per user (or IP if not authenticated)
const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  keyGenerator: (req) => {
    // Use user ID if authenticated, fallback to IP (with IPv6 support)
    if (req.user?.id_utilisateur) {
      return `user_${req.user.id_utilisateur}`;
    }
    return ipKeyGenerator(req);
  },
  message: {
    success: false,
    message: 'Too many uploads. Please try again later.',
    errors: { code: 'RATE_LIMIT_EXCEEDED' },
  },
  standardHeaders: false, // Disable `RateLimit-*` headers
  legacyHeaders: false,
});

module.exports = uploadRateLimiter;
