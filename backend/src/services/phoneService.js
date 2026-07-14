/**
 * SERVICES/PHONESERVICE.JS — Phone number validation and normalization
 * Uses: libphonenumber-js for E.164 format
 * Target country: Burkina Faso (+226)
 */

const { parsePhoneNumber, isValidPhoneNumber } = require('libphonenumber-js');

const BURKINA_FASO_CODE = 'BF';
const BURKINA_FASO_PREFIX = '+226';

const PhoneService = {
  /**
   * Normalize phone to E.164 format (+226XXXXXXXXXX)
   * Accepts:
   *   - +226XXXXXXXXXX
   *   - 226XXXXXXXXXX
   *   - 0XXXXXXXXXX (local format, becomes +226)
   *   - XXXXXXXXXX (10 digits, prepend +226)
   *
   * @param {string} phone - Raw phone number
   * @returns {string} Normalized phone in E.164 format
   * @throws {Error} if invalid
   */
  normalize(phone) {
    if (!phone || typeof phone !== 'string') {
      throw new Error('Phone must be a non-empty string');
    }

    // Remove all whitespace and special chars except +
    let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

    // Try to parse with libphonenumber
    try {
      const parsed = parsePhoneNumber(cleaned, BURKINA_FASO_CODE);

      if (!parsed) {
        throw new Error('Invalid phone number');
      }

      // Get E.164 format
      const e164 = parsed.formatInternational();

      // Verify it's Burkina Faso
      if (!e164.startsWith(BURKINA_FASO_PREFIX)) {
        throw new Error('Phone must be from Burkina Faso (+226)');
      }

      return e164.replace(/[\s\-]/g, ''); // Remove formatting
    } catch (error) {
      throw new Error(`Invalid phone number: ${error.message}`);
    }
  },

  /**
   * Validate Burkina Faso phone number
   * @param {string} phone - Phone in E.164 format (+226XXXXXXXXXX)
   * @returns {boolean}
   */
  validateBurkinaFaso(phone) {
    try {
      if (!phone || !phone.startsWith(BURKINA_FASO_PREFIX)) {
        return false;
      }

      // Must be exactly 13 characters: +226 (4) + 9 digits
      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length !== 12) {
        // 226 (3 digits) + 9 digits
        return false;
      }

      return isValidPhoneNumber(phone);
    } catch {
      return false;
    }
  },

  /**
   * Mask phone number for display (show first 3 and last 2 digits)
   * +226 70 12 34 56 → +226 70 ** ** 56
   */
  mask(phone) {
    if (!phone || phone.length < 4) {
      return '****';
    }

    const prefix = phone.slice(0, 4); // +226
    const suffix = phone.slice(-2); // Last 2 digits
    return `${prefix} ** ** ** ${suffix}`;
  }
};

module.exports = PhoneService;
