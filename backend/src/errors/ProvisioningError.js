/**
 * ERRORS/PROVISIONINGERROR.JS
 * Custom error class for user provisioning operations
 */

class ProvisioningError extends Error {
  /**
   * @param {string} code - Error code ('EMAIL_EXISTS' | 'KEYCLOAK_ERROR' | 'PG_ERROR' | 'ROLLBACK_FAILED')
   * @param {string} message - Human-readable error message
   * @param {object} details - Additional error context (keycloak_id, stack, etc.)
   */
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ProvisioningError';
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ProvisioningError;
