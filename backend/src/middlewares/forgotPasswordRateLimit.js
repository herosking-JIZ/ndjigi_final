const RATE_LIMIT_MESSAGE = {
  success: false,
  message: 'Trop de tentatives. Réessayez dans quelques minutes.'
};

function normalizeEmail(value) {
  return (value || '').trim().toLowerCase();
}

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function createWindowLimiter({ max, windowMs, keyExtractor }) {
  const buckets = new Map();

  return (req, res, next) => {
    const key = keyExtractor(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    const history = buckets.get(key) || [];
    const recent = history.filter((timestamp) => timestamp > windowStart);

    if (recent.length >= max) {
      return res.status(429).json(RATE_LIMIT_MESSAGE);
    }

    recent.push(now);
    buckets.set(key, recent);
    return next();
  };
}

const forgotPasswordIpLimiter = createWindowLimiter({
  max: 3,
  windowMs: 15 * 60 * 1000,
  keyExtractor: (req) => `forgot-ip:${getClientIp(req)}`
});

const forgotPasswordEmailLimiter = createWindowLimiter({
  max: 5,
  windowMs: 15 * 60 * 1000,
  keyExtractor: (req) => {
    const normalizedEmail = normalizeEmail(req.body?.email);
    if (normalizedEmail) {
      return `forgot-email:${normalizedEmail}`;
    }
    return `forgot-email-ip-fallback:${getClientIp(req)}`;
  }
});

const resetPasswordRateLimit = createWindowLimiter({
  max: 10,
  windowMs: 15 * 60 * 1000,
  keyExtractor: (req) => `reset-ip:${getClientIp(req)}`
});

const forgotPasswordRateLimit = [
  forgotPasswordIpLimiter,
  forgotPasswordEmailLimiter
];

module.exports = {
  forgotPasswordRateLimit,
  resetPasswordRateLimit,
  normalizeEmail
};
