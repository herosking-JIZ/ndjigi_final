/**
 * CONSTANTS/ROLECATEGORIES.JS
 * Role categorization and mutual exclusion rules
 *
 * Business Rule (N'DJIGI):
 * - INTERNAL roles (admin, gestionnaire) are mutually exclusive with each other AND with CLIENT roles
 * - CLIENT roles (passager, chauffeur, proprietaire) are cumulable with each other ONLY
 * - No mixing: internal role + client role = FORBIDDEN
 */

const INTERNAL_ROLES = ['admin', 'gestionnaire'];
const CLIENT_ROLES = ['passager', 'chauffeur', 'proprietaire'];
const ALL_ROLES = [...INTERNAL_ROLES, ...CLIENT_ROLES];

/**
 * Check if a role is internal (mutually exclusive)
 * @param {string} role
 * @returns {boolean}
 */
function isInternalRole(role) {
  return INTERNAL_ROLES.includes(role);
}

/**
 * Check if a role is client (cumulable)
 * @param {string} role
 * @returns {boolean}
 */
function isClientRole(role) {
  return CLIENT_ROLES.includes(role);
}

/**
 * Verify if a new role can be added to a user with existing roles
 *
 * Rules:
 * 1. User with internal role (admin/gestionnaire) cannot have ANY other role
 * 2. User with client roles (passager/chauffeur/proprietaire) cannot have internal role
 * 3. admin and gestionnaire are mutually exclusive with each other
 * 4. passager, chauffeur, proprietaire can be combined
 *
 * @param {string[]} existingActiveRoles - Current active roles for the user
 * @param {string} newRole - Role to add
 * @returns {{ allowed: boolean, reason: string|null }}
 */
function canAddRole(existingActiveRoles, newRole) {
  // Validate newRole exists
  if (!ALL_ROLES.includes(newRole)) {
    return { allowed: false, reason: 'UNKNOWN_ROLE' };
  }

  // If user already has this role → no need to add
  if (existingActiveRoles.includes(newRole)) {
    return { allowed: false, reason: 'ROLE_ALREADY_ASSIGNED' };
  }

  // If user has an INTERNAL role → cannot add anything else
  const hasInternalRole = existingActiveRoles.some(isInternalRole);
  if (hasInternalRole) {
    return {
      allowed: false,
      reason: 'USER_HAS_INTERNAL_ROLE_CANNOT_ADD_OTHER'
    };
  }

  // If we're trying to add an INTERNAL role to user with CLIENT roles → forbidden
  if (isInternalRole(newRole) && existingActiveRoles.length > 0) {
    return {
      allowed: false,
      reason: 'CANNOT_ADD_INTERNAL_ROLE_TO_USER_WITH_CLIENT_ROLES'
    };
  }

  // If newRole is CLIENT role → it's allowed (cumulable)
  if (isClientRole(newRole)) {
    return { allowed: true };
  }

  // If newRole is INTERNAL role and user has no roles → allowed
  if (isInternalRole(newRole) && existingActiveRoles.length === 0) {
    return { allowed: true };
  }

  // Should not reach here
  return { allowed: false, reason: 'UNEXPECTED_STATE' };
}

module.exports = {
  INTERNAL_ROLES,
  CLIENT_ROLES,
  ALL_ROLES,
  isInternalRole,
  isClientRole,
  canAddRole
};
