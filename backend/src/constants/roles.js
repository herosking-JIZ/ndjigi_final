/**
 * CONSTANTS/ROLES.JS
 * Role mapping between Keycloak realm roles and local database role names
 * Source of truth for role mappings across the entire application
 */

const ROLE_MAPPING = {
  // Keycloak realm role → Local database role
  'ndjigi-admin': 'admin',
  'ndjigi-gestionnaire': 'gestionnaire',
  'ndjigi-chauffeur': 'chauffeur',
  'ndjigi-passager': 'passager',
  'ndjigi-proprietaire': 'proprietaire',
};

/**
 * Get the local role for a Keycloak role
 * @param {string} kcRole - Keycloak realm role (e.g., 'ndjigi-admin')
 * @returns {string|null} Local role name (e.g., 'admin'), or null if not found
 */
function getLocalRole(kcRole) {
  return ROLE_MAPPING[kcRole] || null;
}

/**
 * Get the Keycloak role for a local role
 * @param {string} localRole - Local role (e.g., 'admin')
 * @returns {string|null} Keycloak realm role (e.g., 'ndjigi-admin'), or null if not found
 */
function getKeycloakRole(localRole) {
  for (const [kcRole, dbRole] of Object.entries(ROLE_MAPPING)) {
    if (dbRole === localRole) return kcRole;
  }
  return null;
}

/**
 * Get the highest privilege role from a list of roles
 * Order: admin > gestionnaire > proprietaire > chauffeur > passager
 * @param {string[]} roles - Array of local role names
 * @returns {string|null} Highest privilege role, or null if empty
 */
function getHighestPrivilegeRole(roles) {
  const priorityOrder = ['admin', 'gestionnaire', 'proprietaire', 'chauffeur', 'passager'];
  for (const role of priorityOrder) {
    if (roles.includes(role)) return role;
  }
  return null;
}

module.exports = {
  ROLE_MAPPING,
  getLocalRole,
  getKeycloakRole,
  getHighestPrivilegeRole,
};
