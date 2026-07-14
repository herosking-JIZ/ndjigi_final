/**
 * UTILS/LOGGER.JS
 * Centralized structured logging using Pino
 *
 * Usage:
 *   const logger = require('../utils/logger');
 *   logger.info({ event: 'user_created', userId, email });
 *   logger.error({ event: 'keycloak_error', message: err.message });
 *   logger.warn({ event: 'email_failed', reason: 'SMTP timeout' });
 */

const pino = require('pino');

const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = pino({
  // Pretty-print in development, JSON in production
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          levelFirst: false,
          singleLine: false,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,

  // Log level
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),

  // Global serializers for common objects
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      ip: req.ip,
      headers: {
        'user-agent': req.get('user-agent'),
        'content-type': req.get('content-type'),
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: res.getHeaders?.(),
    }),
    err: pino.stdSerializers.err,
  },

  // Timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,
});

module.exports = logger;
