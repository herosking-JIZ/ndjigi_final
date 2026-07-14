/**
 * SERVICE/SMSSERVICE.JS
 * Envoie des codes OTP par SMS
 *
 * Modes:
 *  - development: affiche le code dans la console
 *  - production: appel Orange SMS API (TODO)
 */

const axios = require('axios');

/**
 * Envoie un code OTP par SMS
 * @param {string} phone - Numéro au format E.164 (ex: +22670123456)
 * @param {string} code - Code OTP 6 chiffres
 * @returns {Promise<{ success, message }>}
 */
async function send(phone, code) {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    // ─── Mode développement : afficher dans la console ───
    console.log(`
============================================================
  📱 OTP SMS [DEV MODE]
  Phone : ${phone}
  Code  : ${code}
  Valid : 5 minutes
============================================================
    `);
    return { success: true, message: 'SMS simulé en mode dev' };
  }

  // ─── Mode production : appel Orange SMS API ───
  try {
    // TODO: Implémenter l'intégration Orange SMS API
    // POST https://api.orange.com/sms/v1/messages
    // Headers: Authorization, Content-Type
    // Body: { recipientPhoneNumber, senderAddress, outboundSmsTextMessage }

    console.warn('⚠️  SMS Service: Orange SMS API not yet implemented');
    return { success: false, message: 'SMS service not available' };
  } catch (error) {
    console.error('❌ SMS Send Error:', error.message);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
}

module.exports = {
  send
};
