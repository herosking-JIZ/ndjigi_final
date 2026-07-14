/**
 * SERVICES/OTPSERVICE.JS — OTP code generation, storage, and verification
 * Used by: OTP SMS authentication flow (Phase 5)
 */

const crypto = require('crypto');
const { getRedisClient } = require('../config/redis');
const redis = getRedisClient();

const OTP_LENGTH = 6;
const OTP_EXPIRY = 300; // 5 minutes
const MAX_ATTEMPTS = 3;
const BLOCK_DURATION = 900; // 15 minutes

const OtpService = {
  /**
   * Generate 6-digit OTP code
   * @returns {string} OTP code (e.g., "458732")
   */
  generateOtp() {
    return crypto.randomInt(100000, 999999).toString();
  },

  /**
   * Store OTP in Redis
   * @param {string} phone - Normalized phone (+226XXXXXXXXXX)
   * @param {string} code - OTP code
   */
  async storeOtp(phone, code) {
    const key = `otp:${phone}`;
    const data = JSON.stringify({
      code,
      attempts: 0,
      created_at: Math.floor(Date.now() / 1000)
    });

    await redis.setex(key, OTP_EXPIRY, data);
  },

  /**
   * Verify OTP code
   * @param {string} phone - Normalized phone
   * @param {string} code - Code entered by user
   * @returns {boolean} true if valid, throws on error
   */
  async verifyOtp(phone, code) {
    const key = `otp:${phone}`;
    const blockKey = `otp:blocked:${phone}`;

    // Check if phone is blocked after 3 failed attempts
    const isBlocked = await redis.exists(blockKey);
    if (isBlocked) {
      const err = new Error('OTP_BLOCKED');
      err.code = 'OTP_BLOCKED';
      throw err;
    }

    // Get OTP data
    const otpData = await redis.get(key);
    if (!otpData) {
      const err = new Error('OTP expired or not found');
      err.code = 'OTP_EXPIRED';
      throw err;
    }

    const { code: storedCode, attempts } = JSON.parse(otpData);

    // Verify code
    if (code !== storedCode) {
      const newAttempts = attempts + 1;

      // Block after 3 failed attempts
      if (newAttempts >= MAX_ATTEMPTS) {
        await redis.setex(blockKey, BLOCK_DURATION, '1');
        await redis.del(key);

        const err = new Error('OTP_BLOCKED');
        err.code = 'OTP_BLOCKED';
        throw err;
      }

      // Update attempt counter
      await redis.setex(
        key,
        OTP_EXPIRY,
        JSON.stringify({
          code: storedCode,
          attempts: newAttempts,
          created_at: JSON.parse(otpData).created_at
        })
      );

      const err = new Error('Invalid OTP code');
      err.code = 'INVALID_OTP';
      err.attemptsRemaining = MAX_ATTEMPTS - newAttempts;
      throw err;
    }

    // Valid code: delete OTP data
    await redis.del(key);
    return true;
  },

  /**
   * Resend OTP (with 60-second cooldown)
   * @param {string} phone - Normalized phone
   */
  async resendOtp(phone) {
    const cooldownKey = `otp:cooldown:${phone}`;
    const onCooldown = await redis.exists(cooldownKey);

    if (onCooldown) {
      const ttl = await redis.ttl(cooldownKey);
      const err = new Error('Resend cooldown active');
      err.code = 'RESEND_COOLDOWN';
      err.retryAfter = ttl;
      throw err;
    }

    // Set cooldown
    await redis.setex(cooldownKey, 60, '1');
  },

  /**
   * Check if phone is blocked
   */
  async isPhoneBlocked(phone) {
    const blockKey = `otp:blocked:${phone}`;
    return await redis.exists(blockKey);
  }
};

module.exports = OtpService;
