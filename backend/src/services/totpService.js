/**
 * SERVICES/TOTPSERVICE.JS — Time-based One-Time Password (TOTP) management
 * Used by: 2FA TOTP setup and verification for passengers/drivers
 * Library: speakeasy (generates TOTP secrets and validates codes)
 */

const speakeasy = require('speakeasy');

const WINDOW = 1; // ±1 time step (±30 seconds) for clock skew tolerance
const STEP = 30; // Standard 30-second time steps

const TotpService = {
  /**
   * Generate TOTP secret and QR code URL
   * @param {string} userEmail - User's email for label
   * @returns {Object} { secret: "base32", qr_code_url: "otpauth://..." }
   */
  generateSecret(userEmail) {
    try {
      const secret = speakeasy.generateSecret({
        name: `N'DJIGI (${userEmail})`,
        issuer: 'N\'DJIGI',
        length: 32, // Strong 32-byte secret
      });

      return {
        secret: secret.base32, // "ABCD1234EFGH5678..." for manual entry if needed
        qr_code_url: secret.otpauth_url, // "otpauth://totp/..." for QR code
      };
    } catch (error) {
      throw new Error(`Failed to generate TOTP secret: ${error.message}`);
    }
  },

  /**
   * Validate TOTP code against secret
   * Includes window of ±1 step for clock tolerance
   *
   * @param {string} secret - Base32 encoded secret
   * @param {string} token - 6-digit code entered by user
   * @returns {boolean} true if valid, false otherwise
   */
  verify(secret, token) {
    try {
      if (!secret || !token) {
        return false;
      }

      // Remove any whitespace from token
      const cleanToken = token.toString().trim();

      // Validate token is 6 digits
      if (!/^\d{6}$/.test(cleanToken)) {
        return false;
      }

      const isValid = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: cleanToken,
        window: WINDOW, // ±1 step tolerance
      });

      return !!isValid;
    } catch (error) {
      console.error('⚠️ TOTP verification error:', error.message);
      return false;
    }
  },

  /**
   * Generate TOTP code for current time (for testing)
   * @param {string} secret - Base32 encoded secret
   * @returns {string} 6-digit TOTP code
   */
  generate(secret) {
    try {
      const token = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      return token.toString();
    } catch (error) {
      throw new Error(`Failed to generate TOTP code: ${error.message}`);
    }
  },

  /**
   * Parse otpauth URL to extract secret
   * Format: otpauth://totp/issuer:user@example.com?secret=...&issuer=...
   * @param {string} url - otpauth URL
   * @returns {string|null} base32 secret or null if not found
   */
  parseOtpauthUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('secret');
    } catch {
      return null;
    }
  },
};

module.exports = TotpService;
