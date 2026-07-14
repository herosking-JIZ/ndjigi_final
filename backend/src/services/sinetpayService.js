/**
 * SINETPAY SERVICE
 * Point d'intégration centralisé avec l'API SinetPay (Orange Money / Mobile Money)
 *
 * Responsabilités :
 * - Initier des paiements (recharge portefeuille)
 * - Initier des retraits (vers compte Orange Money)
 * - Valider les signatures HMAC-SHA256 des webhooks
 */

const axios = require('axios');
const crypto = require('crypto');

const SINETPAY_API_KEY = process.env.SINETPAY_API_KEY || '';
const SINETPAY_SECRET = process.env.SINETPAY_SECRET || '';
const SINETPAY_BASE_URL = process.env.SINETPAY_BASE_URL || 'https://api.sinetpay.com/v1';
const SINETPAY_NOTIFY_URL = process.env.SINETPAY_NOTIFY_URL || '';

if (!SINETPAY_API_KEY || !SINETPAY_SECRET) {
  console.warn('⚠️ SinetPay credentials not configured in .env');
}

// Client axios configuré pour SinetPay
const sinetpayClient = axios.create({
  baseURL: SINETPAY_BASE_URL,
  timeout: 30000,
  headers: {
    'Authorization': `Bearer ${SINETPAY_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Initie un paiement via SinetPay (recharge portefeuille)
 * @param {Object} params
 * @param {string} params.transactionId - ID unique de la transaction (ex: RCH-uuid)
 * @param {number} params.montant - Montant en XOF
 * @param {string} params.description - Description du paiement
 * @param {string} params.numeroTelephone - Numéro téléphone au format +226XXXXXXXX
 * @param {string} params.nomClient - Nom du client
 * @returns {Promise<Object>} { paymentToken, paymentUrl, status }
 * @throws {Error} Si l'appel SinetPay échoue
 */
async function initierPaiement(params) {
  const { transactionId, montant, description, numeroTelephone, nomClient } = params;

  try {
    console.log(`🔄 SinetPay: Initiation paiement ${transactionId} (${montant} XOF)`);

    const payload = {
      transaction_id: transactionId,
      amount: montant,
      currency: 'XOF',
      description: description,
      customer: {
        phone: numeroTelephone,
        name: nomClient,
      },
      notification_url: SINETPAY_NOTIFY_URL,
    };

    const response = await sinetpayClient.post('/payment/init', payload);

    const { data } = response;
    console.log(`✅ SinetPay: Paiement initié ${transactionId}`);

    return {
      paymentToken: data.payment_token || data.token,
      paymentUrl: data.payment_url || data.url,
      status: data.status || 'INITIATED',
      reference: data.reference,
    };
  } catch (error) {
    console.error(`❌ SinetPay erreur (initierPaiement ${transactionId}):`, error.response?.data || error.message);
    throw new Error(`SinetPay payment init failed: ${error.message}`);
  }
}

/**
 * Initie un retrait vers un compte Orange Money (via SinetPay)
 * @param {Object} params
 * @param {string} params.transactionId - ID unique (ex: RTR-uuid)
 * @param {number} params.montant - Montant à reverser en XOF
 * @param {string} params.numeroTelephone - Numéro du bénéficiaire +226XXXXXXXX
 * @param {string} params.nomBeneficiaire - Nom du bénéficiaire
 * @returns {Promise<Object>} { disbursementId, status }
 * @throws {Error} Si l'appel SinetPay échoue
 */
async function initierRetrait(params) {
  const { transactionId, montant, numeroTelephone, nomBeneficiaire } = params;

  try {
    console.log(`🔄 SinetPay: Initiation retrait ${transactionId} (${montant} XOF)`);

    const payload = {
      transaction_id: transactionId,
      amount: montant,
      currency: 'XOF',
      recipient: {
        phone: numeroTelephone,
        name: nomBeneficiaire,
      },
      notification_url: SINETPAY_NOTIFY_URL,
    };

    const response = await sinetpayClient.post('/disbursement/init', payload);

    const { data } = response;
    console.log(`✅ SinetPay: Retrait initié ${transactionId}`);

    return {
      disbursementId: data.disbursement_id || data.id,
      status: data.status || 'PENDING',
      reference: data.reference,
    };
  } catch (error) {
    console.error(`❌ SinetPay erreur (initierRetrait ${transactionId}):`, error.response?.data || error.message);
    throw new Error(`SinetPay disbursement init failed: ${error.message}`);
  }
}

/**
 * Valide la signature HMAC-SHA256 d'un webhook SinetPay
 * La signature est envoyée dans le header X-SinetPay-Signature
 * @param {Buffer} rawBody - Body brut (avant parsing JSON)
 * @param {string} headerSignature - Valeur du header X-SinetPay-Signature
 * @returns {boolean} true si signature valide
 */
function validerSignatureWebhook(rawBody, headerSignature) {
  try {
    // Calculer HMAC-SHA256
    const computed = crypto
      .createHmac('sha256', SINETPAY_SECRET)
      .update(rawBody)
      .digest('hex');

    // Comparaison constant-time (protection contre timing attacks)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(headerSignature)
    );

    if (!isValid) {
      console.log(`⚠️ Webhook signature invalide. Attendu: ${computed}, Reçu: ${headerSignature}`);
    }

    return isValid;
  } catch (err) {
    console.error('❌ Erreur validation signature webhook:', err.message);
    return false;
  }
}

/**
 * Vérifie le statut d'une transaction auprès de SinetPay (optionnel, pour polling)
 * @param {string} transactionId - ID de la transaction
 * @returns {Promise<Object>} { status, amount, reference }
 */
async function verifierStatut(transactionId) {
  try {
    const response = await sinetpayClient.get(`/transaction/${transactionId}/status`);
    return response.data;
  } catch (error) {
    console.error(`❌ SinetPay erreur (verifierStatut ${transactionId}):`, error.message);
    throw error;
  }
}

module.exports = {
  initierPaiement,
  initierRetrait,
  validerSignatureWebhook,
  verifierStatut,
};
