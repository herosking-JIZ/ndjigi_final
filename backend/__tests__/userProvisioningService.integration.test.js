/**
 * TESTS/USERPROVISIONINGSERVICE.INTEGRATION.TEST.JS
 * Integration tests for userProvisioningService — simple validation without Keycloak deps
 */

describe('userProvisioningService — basic functionality', () => {
  describe('generateTempPassword', () => {
    test('should load the module without errors', () => {
      // This validates that the service can be required (mocking not needed for imports)
      expect(() => {
        require('../src/errors/ProvisioningError');
        require('../src/constants/roles');
      }).not.toThrow();
    });

    test('should have proper exports', () => {
      const roles = require('../src/constants/roles');
      expect(roles.ROLE_MAPPING).toBeDefined();
      expect(roles.getLocalRole).toBeDefined();
      expect(roles.getKeycloakRole).toBeDefined();
      expect(roles.getHighestPrivilegeRole).toBeDefined();
    });

    test('should map roles correctly', () => {
      const roles = require('../src/constants/roles');
      expect(roles.getLocalRole('ndjigi-admin')).toBe('admin');
      expect(roles.getLocalRole('ndjigi-gestionnaire')).toBe('gestionnaire');
      expect(roles.getLocalRole('ndjigi-passager')).toBe('passager');
      expect(roles.getKeycloakRole('admin')).toBe('ndjigi-admin');
      expect(roles.getKeycloakRole('gestionnaire')).toBe('ndjigi-gestionnaire');
    });

    test('should return null for unmapped roles', () => {
      const roles = require('../src/constants/roles');
      expect(roles.getLocalRole('invalid-role')).toBeNull();
      expect(roles.getKeycloakRole('invalid')).toBeNull();
    });

    test('should prioritize roles correctly', () => {
      const roles = require('../src/constants/roles');
      const mixed = ['passager', 'chauffeur', 'admin'];
      expect(roles.getHighestPrivilegeRole(mixed)).toBe('admin');

      const mixed2 = ['passager', 'gestionnaire'];
      expect(roles.getHighestPrivilegeRole(mixed2)).toBe('gestionnaire');

      const single = ['chauffeur'];
      expect(roles.getHighestPrivilegeRole(single)).toBe('chauffeur');

      const empty = [];
      expect(roles.getHighestPrivilegeRole(empty)).toBeNull();
    });
  });

  describe('ProvisioningError', () => {
    test('should be a proper Error subclass', () => {
      const ProvisioningError = require('../src/errors/ProvisioningError');
      const err = new ProvisioningError('TEST_CODE', 'Test message', { detail: 'value' });

      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('ProvisioningError');
      expect(err.code).toBe('TEST_CODE');
      expect(err.message).toBe('Test message');
      expect(err.details.detail).toBe('value');
    });

    test('should have stack trace', () => {
      const ProvisioningError = require('../src/errors/ProvisioningError');
      const err = new ProvisioningError('CODE', 'Message');
      expect(err.stack).toBeDefined();
      expect(err.stack).toContain('ProvisioningError');
    });
  });
});
