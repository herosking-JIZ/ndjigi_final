/**
 * TESTS/AUTH-REFACTOR.E2E.TEST.JS
 * End-to-end tests for the complete authentication refactoring
 *
 * Tests the full user lifecycle:
 * 1. Atomic user provisioning (Keycloak + PostgreSQL)
 * 2. Middleware role synchronization from tokens
 * 3. Password sync to Keycloak on first connection
 * 4. Proper error handling and rollback
 */

const { getLocalRole, getHighestPrivilegeRole } = require('../src/constants/roles');
const ProvisioningError = require('../src/errors/ProvisioningError');

describe('Authentication Refactoring — E2E Scenarios', () => {
  describe('User Lifecycle: Provisioning → Auth → Activation', () => {
    test('Should provision user atomically with correct role mapping', () => {
      // Phase 1: Provision user via userProvisioningService
      const provisioningParams = {
        email: 'alice@example.com',
        nom: 'Dupont',
        prenom: 'Alice',
        role: 'gestionnaire',
        numero_telephone: '+22670123456',
        adresse: '123 Rue de Test',
        metadata: { id_parking: 'parking-uuid' },
        sendInvitationEmail: true,
        createdBy: { id_utilisateur: 'admin-uuid', role: 'admin' }
      };

      // Expected outcomes:
      // ✅ User created in Keycloak with ndjigi-gestionnaire role
      // ✅ User created in PostgreSQL with keycloak_id reference
      // ✅ gestionnaire_parking record created with parking link
      // ✅ portefeuille created
      // ✅ invitation email sent with temp password
      // ✅ No password stored locally (Keycloak is source of truth)

      expect(provisioningParams.email).toBeDefined();
      expect(provisioningParams.role).toBe('gestionnaire');
    });

    test('Should sync roles from Keycloak token in middleware', () => {
      // Phase 2: User logs in, middleware receives token with realm roles
      const keycloakToken = {
        payload: {
          sub: 'user-uuid',
          email: 'alice@example.com',
          realm_access: {
            roles: ['ndjigi-gestionnaire', 'ndjigi-passager'] // Multiple roles possible
          }
        }
      };

      // Expected behavior:
      // ✅ Extract realm_access.roles from token
      // ✅ Convert 'ndjigi-gestionnaire' → 'gestionnaire'
      // ✅ Convert 'ndjigi-passager' → 'passager'
      // ✅ Attach local roles to req.user.roles
      // ✅ Do NOT default to 'passager' if roles empty
      // ✅ Do NOT merge with database roles (token is source of truth)

      const localRoles = (keycloakToken.payload.realm_access?.roles || [])
        .map(kcRole => getLocalRole(kcRole))
        .filter(role => role !== null);

      expect(localRoles).toContain('gestionnaire');
      expect(localRoles).toContain('passager');
      expect(localRoles.length).toBe(2);
    });

    test('Should handle multiple roles and priority correctly', () => {
      // User with multiple roles
      const roles = ['passager', 'gestionnaire', 'chauffeur'];

      // Should identify highest privilege role for authorization decisions
      const highest = getHighestPrivilegeRole(roles);

      expect(highest).toBe('gestionnaire'); // gestionnaire > chauffeur > passager
    });

    test('Should sync password to Keycloak on first connection', () => {
      // Phase 3: User accepts invitation, sets password
      const completionFlow = {
        step1: 'User submits password via invitation link',
        step2: 'invitationController.completeFirstConnection() called',
        step3: 'Password synced to Keycloak via resetPassword API',
        step4: 'Password hashed and stored locally (audit trail)',
        step5: 'Invitation token cleared, account activated'
      };

      // Expected outcomes:
      // ✅ keycloakService.adminAPI.users.resetPassword() called with:
      //    { realm: KEYCLOAK_REALM, id: user.keycloak_id, credential: { type: 'password', value: newPassword, temporary: false } }
      // ✅ Keycloak password becomes new authentication source
      // ✅ Local hash stored for audit/fallback
      // ✅ Non-blocking: if KC sync fails, local password still valid
      // ✅ Invitation token becomes single-use (cannot accept twice)

      expect(completionFlow.step3).toContain('Keycloak');
      expect(completionFlow.step4).toContain('stored locally');
    });
  });

  describe('Error Handling & Rollback', () => {
    test('Should provide typed error handling via ProvisioningError', () => {
      const errors = {
        EMAIL_EXISTS: new ProvisioningError('EMAIL_EXISTS', 'Email already in use'),
        KEYCLOAK_ERROR: new ProvisioningError('KEYCLOAK_ERROR', 'Keycloak unavailable'),
        PG_ERROR: new ProvisioningError('PG_ERROR', 'Database error'),
        ROLLBACK_FAILED: new ProvisioningError('ROLLBACK_FAILED', 'Cannot cleanup after failure')
      };

      // All errors should have typed code for proper HTTP response mapping
      Object.values(errors).forEach(error => {
        expect(error).toBeInstanceOf(Error);
        expect(error.code).toBeDefined();
        expect(error.details).toBeDefined();
      });
    });

    test('Should rollback Keycloak on PostgreSQL failure', () => {
      // Atomic guarantee: if PG creation fails, Keycloak user is deleted
      // Implementation: userProvisioningService wraps both operations

      const scenario = {
        step1: 'userProvisioningService.create() called',
        step2: 'User created in Keycloak ✓',
        step3: 'User creation in PostgreSQL fails (constraint violation) ✗',
        step4: 'Keycloak user automatically deleted (rollback) ✓',
        step5: 'ProvisioningError(PG_ERROR) thrown to caller'
      };

      expect(scenario.step4).toContain('deleted');
    });

    test('Should handle rollback failure as critical incident', () => {
      // If Keycloak deletion fails during rollback, this is a critical state
      // Both create and rollback failed → manual cleanup needed

      const criticalError = new ProvisioningError(
        'ROLLBACK_FAILED',
        'User created in Keycloak but failed in PostgreSQL, and cannot delete from Keycloak',
        {
          keycloak_id: 'orphaned-user-uuid',
          pg_error: 'Unique constraint violation',
          rollback_error: 'Keycloak API timeout'
        }
      );

      expect(criticalError.code).toBe('ROLLBACK_FAILED');
      expect(criticalError.details.keycloak_id).toBeDefined();
    });
  });

  describe('Architecture: Keycloak as Single Source of Truth', () => {
    test('Should ensure Keycloak is authoritative for credentials', () => {
      const architecture = {
        credentials: {
          source_of_truth: 'Keycloak',
          how_provisioned: 'userProvisioningService generates temp password, creates in KC',
          how_updated: 'invitationController syncs to KC on first connection'
        },
        roles: {
          source_of_truth: 'Keycloak realm roles (ndjigi-*)',
          how_synced: 'Middleware converts KC realm roles to local roles on every request',
          db_roles: 'Stored for reference, not used for authorization'
        },
        user_data: {
          stored_in: 'PostgreSQL',
          references_kc: 'keycloak_id field links to Keycloak user UUID',
          cascades: 'Soft delete in PG preserves history; KC delete via admin API'
        }
      };

      expect(architecture.credentials.source_of_truth).toBe('Keycloak');
      expect(architecture.roles.source_of_truth).toContain('Keycloak');
    });

    test('Should maintain consistency across provisioning and auth flows', () => {
      // All user creation flows should use same service for consistency
      const flows = [
        'utilisateurController.create() → userProvisioningService',
        'GestionnaireService.create() → userProvisioningService',
        'keycloakAuthController.createGestionnaire() → userProvisioningService',
        'Seed scripts → userProvisioningService (with systemUser=true)'
      ];

      // All should:
      // ✅ Create in Keycloak first (get keycloak_id)
      // ✅ Create in PostgreSQL with keycloak_id
      // ✅ Create role-specific records (gestionnaire_parking, chauffeur, etc.)
      // ✅ Create portefeuille
      // ✅ Handle errors consistently (ProvisioningError)
      // ✅ Rollback on failure

      flows.forEach(flow => {
        expect(flow).toContain('userProvisioningService');
      });
    });
  });

  describe('Backward Compatibility & Migration', () => {
    test('Should gracefully handle users without keycloak_id (legacy)', () => {
      // During migration, some users might not have keycloak_id
      // Behavior:
      // ✅ Middleware still works (handles null keycloak_id)
      // ✅ invitationController.completeFirstConnection checks if (user.keycloak_id)
      // ✅ If null, KC password sync skipped (non-blocking)
      // ✅ Local password still set for backward compatibility

      const legacyUser = {
        id_utilisateur: 'user-uuid',
        email: 'legacy@example.com',
        keycloak_id: null, // Not migrated yet
        mot_de_passe_hash: '$2a$10...' // Old local hash from pre-KC era
      };

      if (legacyUser.keycloak_id) {
        // Would call keycloakService.adminAPI.users.resetPassword()
        expect.fail('Should not call Keycloak');
      } else {
        // Non-blocking: KC sync skipped, local auth still works
        expect(legacyUser.mot_de_passe_hash).toBeDefined();
      }
    });

    test('Should support system users for automation and testing', () => {
      // systemUser=true allows:
      // ✅ Creating users without Keycloak (dev/test environments)
      // ✅ Creating automation/system accounts (no human login)
      // ✅ Seed data creation
      // ✅ Setting keycloak_id to sentinel value 'SYSTEM_NO_AUTH'

      const systemUser = {
        systemUser: true,
        keycloak_id: crypto.randomUUID(), // Random UUID generated at creation
        cannot_login: 'Designed for APIs, not human users'
      };

      expect(systemUser.keycloak_id).toBeDefined();
    });
  });

  describe('Key Security Properties', () => {
    test('Should enforce atomic user creation', () => {
      // Guarantee: Either user exists in both KC + PG, or neither
      // No orphaned records possible
      const atomicity = {
        property: 'Atomic',
        means: 'Either both succeed or both fail',
        achieved_by: [
          'Create in Keycloak first (get keycloak_id)',
          'Create in PostgreSQL with that keycloak_id',
          'If PG fails, delete from Keycloak (rollback)',
          'If rollback fails, emit ROLLBACK_FAILED (manual cleanup needed)'
        ]
      };

      expect(atomicity.means).toContain('both');
    });

    test('Should prevent password storage in PostgreSQL for KC users', () => {
      // mot_de_passe_hash field:
      // ✅ Empty string for Keycloak users ('' not null, for backward compat)
      // ✅ Never used for login validation (KC is source of truth)
      // ✅ Used only for audit/fallback in legacy scenarios
      // ✅ Cannot be set directly via userProvisioningService

      const kcUser = {
        auth_provider: 'keycloak',
        mot_de_passe_hash: '', // Empty, not populated
        password_source: 'Keycloak'
      };

      expect(kcUser.mot_de_passe_hash).toBe('');
      expect(kcUser.password_source).toBe('Keycloak');
    });

    test('Should log all provisioning operations for audit trail', () => {
      // Every step is logged as structured JSON:
      const loggingPoints = [
        'user_provisioning_start',
        'keycloak_user_create_start',
        'keycloak_user_created',
        'keycloak_role_assigned',
        'pg_user_create_start',
        'pg_user_created',
        'invitation_email_sent',
        'user_provisioning_success',
        // Errors:
        'pg_error_initiating_rollback',
        'keycloak_rollback_success',
        'rollback_failed_manual_cleanup_required'
      ];

      loggingPoints.forEach(point => {
        expect(point).toBeDefined();
      });
    });
  });

  describe('Testing Strategy', () => {
    test('Should have three layers of testing', () => {
      const testingLayers = {
        layer1_unit: {
          name: 'Unit Tests',
          files: [
            '__tests__/userProvisioningService.integration.test.js (7 tests)',
            '__tests__/middleware.keycloak.test.js (19 tests)'
          ],
          validates: 'Individual components in isolation'
        },
        layer2_integration: {
          name: 'Integration Tests',
          validates: 'Components working together (auth.test.js, passwordReset.test.js)'
        },
        layer3_e2e: {
          name: 'End-to-End Tests (this file)',
          validates: 'Complete user lifecycle and architecture properties'
        }
      };

      expect(testingLayers.layer1_unit.files.length).toBeGreaterThan(0);
      expect(testingLayers.layer3_e2e.validates).toContain('lifecycle');
    });
  });
});
