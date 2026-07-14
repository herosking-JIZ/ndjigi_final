const crypto = require('crypto');

/**
 * Generates a unique initial password for a new gestionnaire
 * Format: Gestionnaire@XXXX (4 random digits)
 * Example: Gestionnaire@7392, Gestionnaire@1058
 *
 * @returns {string} Unique temporary password
 */
function generateInitialPassword() {
  const digits = crypto.randomInt(1000, 10000); // 1000-9999
  return `Gestionnaire@${digits}`;
}

module.exports = { generateInitialPassword };
