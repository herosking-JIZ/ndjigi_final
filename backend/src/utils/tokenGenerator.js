/**
 * UTILS/TOKENGENERATOR.JS
 * Generate short, unique tokens for share links
 */

const crypto = require('crypto');

/**
 * Generate a short URL-safe token (8 characters)
 * Entropy: 48 bits — sufficient for temporary link (4h expiry + rate limit)
 * Example: "aB3kR9xZ"
 *
 * @returns {string} 8-character token
 */
function generateShareToken() {
  return crypto.randomBytes(6).toString('base64url');
}

module.exports = { generateShareToken };
