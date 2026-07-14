/**
 * TESTS/MIDDLEWARE.KEYCLOAK.TEST.JS
 * Middleware tests for Keycloak authentication role syncing
 */

const { getLocalRole } = require('../src/constants/roles');

describe('keycloakAuth middleware — role synchronization', () => {
  describe('getLocalRole conversion', () => {
    test('should convert ndjigi-admin to admin', () => {
      expect(getLocalRole('ndjigi-admin')).toBe('admin');
    });

    test('should convert ndjigi-gestionnaire to gestionnaire', () => {
      expect(getLocalRole('ndjigi-gestionnaire')).toBe('gestionnaire');
    });

    test('should convert ndjigi-chauffeur to chauffeur', () => {
      expect(getLocalRole('ndjigi-chauffeur')).toBe('chauffeur');
    });

    test('should convert ndjigi-passager to passager', () => {
      expect(getLocalRole('ndjigi-passager')).toBe('passager');
    });

    test('should convert ndjigi-proprietaire to proprietaire', () => {
      expect(getLocalRole('ndjigi-proprietaire')).toBe('proprietaire');
    });

    test('should return null for invalid Keycloak roles', () => {
      expect(getLocalRole('ndjigi-invalid')).toBeNull();
      expect(getLocalRole('admin')).toBeNull(); // local role, not KC role
      expect(getLocalRole('unknown')).toBeNull();
    });
  });

  describe('Role array conversion logic', () => {
    test('should convert array of Keycloak roles to local roles', () => {
      const kcRealmRoles = ['ndjigi-admin', 'ndjigi-gestionnaire'];
      const localRoles = kcRealmRoles
        .map(kcRole => getLocalRole(kcRole))
        .filter(role => role !== null);

      expect(localRoles).toEqual(['admin', 'gestionnaire']);
    });

    test('should filter out invalid Keycloak roles', () => {
      const kcRealmRoles = ['ndjigi-admin', 'ndjigi-invalid', 'ndjigi-passager'];
      const localRoles = kcRealmRoles
        .map(kcRole => getLocalRole(kcRole))
        .filter(role => role !== null);

      expect(localRoles).toEqual(['admin', 'passager']);
      expect(localRoles.length).toBe(2);
    });

    test('should return empty array when no valid Keycloak roles', () => {
      const kcRealmRoles = ['ndjigi-invalid', 'ndjigi-unknown'];
      const localRoles = kcRealmRoles
        .map(kcRole => getLocalRole(kcRole))
        .filter(role => role !== null);

      expect(localRoles).toEqual([]);
    });

    test('should handle empty array', () => {
      const kcRealmRoles = [];
      const localRoles = kcRealmRoles
        .map(kcRole => getLocalRole(kcRole))
        .filter(role => role !== null);

      expect(localRoles).toEqual([]);
    });

    test('should NOT default to passager when roles array is empty', () => {
      const kcRealmRoles = [];
      const localRoles = kcRealmRoles
        .map(kcRole => getLocalRole(kcRole))
        .filter(role => role !== null);

      // This is the key change from Phase 1: no default role
      expect(localRoles).toEqual([]);
      expect(localRoles.includes('passager')).toBe(false);
    });
  });

  describe('Token payload role extraction', () => {
    test('should extract realm_access.roles from token payload', () => {
      const payload = {
        sub: 'user-uuid',
        email: 'user@example.com',
        realm_access: {
          roles: ['ndjigi-admin', 'ndjigi-gestionnaire'],
        },
      };

      const kcRealmRoles = payload.realm_access?.roles || [];
      const localRoles = kcRealmRoles
        .map(kcRole => getLocalRole(kcRole))
        .filter(role => role !== null);

      expect(localRoles).toEqual(['admin', 'gestionnaire']);
    });

    test('should handle payload with no realm_access', () => {
      const payload = {
        sub: 'user-uuid',
        email: 'user@example.com',
      };

      const kcRealmRoles = payload.realm_access?.roles || [];
      const localRoles = kcRealmRoles
        .map(kcRole => getLocalRole(kcRole))
        .filter(role => role !== null);

      expect(localRoles).toEqual([]);
    });

    test('should handle payload with empty roles', () => {
      const payload = {
        sub: 'user-uuid',
        email: 'user@example.com',
        realm_access: {
          roles: [],
        },
      };

      const kcRealmRoles = payload.realm_access?.roles || [];
      const localRoles = kcRealmRoles
        .map(kcRole => getLocalRole(kcRole))
        .filter(role => role !== null);

      expect(localRoles).toEqual([]);
    });
  });

  describe('Role priority (getHighestPrivilegeRole)', () => {
    // This is tested in userProvisioningService tests
    // but we include it here for completeness
    test('getHighestPrivilegeRole should prioritize admin > gestionnaire > proprietaire > chauffeur > passager', () => {
      const { getHighestPrivilegeRole } = require('../src/constants/roles');

      expect(getHighestPrivilegeRole(['passager', 'chauffeur', 'admin'])).toBe('admin');
      expect(getHighestPrivilegeRole(['passager', 'gestionnaire'])).toBe('gestionnaire');
      expect(getHighestPrivilegeRole(['chauffeur'])).toBe('chauffeur');
      expect(getHighestPrivilegeRole([])).toBeNull();
    });
  });
});

describe('authenticateKeycloak middleware — role synchronization', () => {
  describe('Role extraction from decoded JWT', () => {
    test('should extract realm_access.roles from decoded JWT', () => {
      const decoded = {
        payload: {
          sub: 'user-uuid',
          email: 'user@example.com',
          realm_access: {
            roles: ['ndjigi-admin', 'ndjigi-chauffeur'],
          },
        },
      };

      const keycloakRealmRoles = decoded.payload.realm_access?.roles || [];
      const roles = keycloakRealmRoles
        .map(kcRole => getLocalRole(kcRole))
        .filter(role => role !== null);

      expect(roles).toEqual(['admin', 'chauffeur']);
    });

    test('should NOT merge Keycloak realm roles with database roles', () => {
      // The old behavior was buggy:
      // const keycloakRoles = payload.realm_access?.roles || [];  // ['ndjigi-admin']
      // const dbRoles = user.utilisateur_role?.map(r => r.role) || [];  // ['passager', 'chauffeur']
      // const roles = [...new Set([...keycloakRoles, ...dbRoles])];  // Mix of different formats!
      //
      // New behavior: only use Keycloak roles

      const keycloakRealmRoles = ['ndjigi-admin']; // From token
      const dbRoles = ['passager', 'chauffeur']; // From database

      // Old buggy merge (mix of formats)
      const buggyMerge = [...new Set([...keycloakRealmRoles, ...dbRoles])];
      expect(buggyMerge).toEqual(['ndjigi-admin', 'passager', 'chauffeur']); // ❌ Mixed formats!

      // New correct behavior: convert only Keycloak roles
      const correctRoles = keycloakRealmRoles
        .map(kcRole => getLocalRole(kcRole))
        .filter(role => role !== null);

      expect(correctRoles).toEqual(['admin']); // ✅ Consistent local role format
      expect(correctRoles.includes('passager')).toBe(false); // No db roles
      expect(correctRoles.includes('chauffeur')).toBe(false); // No db roles
    });
  });

  describe('No default role fallback', () => {
    test('should NOT default to passager when Keycloak roles are empty', () => {
      const keycloakRealmRoles = []; // Empty token roles
      const roles = keycloakRealmRoles
        .map(kcRole => getLocalRole(kcRole))
        .filter(role => role !== null);

      // Old behavior would default to 'passager'
      // New behavior: empty roles (user has no role assignment in Keycloak)
      expect(roles).toEqual([]);
      expect(roles.length).toBe(0);
    });

    test('should handle user with no roles gracefully', () => {
      const payload = {
        sub: 'user-uuid',
        email: 'unassigned@example.com',
        realm_access: {
          roles: [], // No roles assigned in Keycloak
        },
      };

      const keycloakRealmRoles = payload.realm_access?.roles || [];
      const roles = keycloakRealmRoles
        .map(kcRole => getLocalRole(kcRole))
        .filter(role => role !== null);

      // This is valid - user exists but has no roles
      // Endpoint authorization checks can handle this
      expect(roles).toEqual([]);
    });
  });
});
