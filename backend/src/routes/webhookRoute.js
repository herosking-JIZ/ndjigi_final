/**
 * WEBHOOK ROUTE
 * Routes de webhooks (sans authentification)
 * À monter dans index.js AVANT le middleware d'authentification global
 */

const express = require('express');
const { WebhookController } = require('../controllers/paiementController');

const webhookRoute = express.Router();

/**
 * POST /webhook/sinetpay
 * Webhook de notification SinetPay (recharge et retrait)
 * Body parsé en RAW pour validation HMAC-SHA256
 *
 * Payload attendu :
 * {
 *   "transaction_id": "RCH-xxxxx",
 *   "status": "SUCCESS|FAILED|PENDING",
 *   "amount": 5000,
 *   ...
 * }
 */
webhookRoute.post(
  '/sinetpay',
  express.raw({ type: 'application/json' }),
  WebhookController.sinetpay
);

module.exports = webhookRoute;
