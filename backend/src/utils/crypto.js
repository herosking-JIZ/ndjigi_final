/**
 * UTILS/CRYPTO.JS — AES-256-GCM encryption for sensitive data
 * Used for: technical password encryption, secure storage
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypt data with AES-256-GCM
 * @param {string} plaintext - Data to encrypt
 * @returns {string} Format: "iv:encryptedData:authTag" (hex)
 */
function encrypt(plaintext) {
  const key = Buffer.from(process.env.CRYPTO_SECRET, 'hex');
  if (key.length !== 32) {
    throw new Error('CRYPTO_SECRET must be 64 hex characters (32 bytes)');
  }

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
}

/**
 * Decrypt AES-256-GCM encrypted data
 * @param {string} encryptedString - Format: "iv:encryptedData:authTag" (hex)
 * @returns {string} Decrypted plaintext
 */
function decrypt(encryptedString) {
  const key = Buffer.from(process.env.CRYPTO_SECRET, 'hex');
  if (key.length !== 32) {
    throw new Error('CRYPTO_SECRET must be 64 hex characters (32 bytes)');
  }

  const [ivHex, encrypted, authTagHex] = encryptedString.split(':');

  if (!ivHex || !encrypted || !authTagHex) {
    throw new Error('Invalid encrypted format');
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivHex, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate random technical password (32 hex chars)
 */
function generateTechPassword() {
  return crypto.randomBytes(16).toString('hex');
}

module.exports = {
  encrypt,
  decrypt,
  generateTechPassword
};
