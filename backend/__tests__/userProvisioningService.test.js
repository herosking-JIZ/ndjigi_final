/**
 * TESTS/USERPROVISIONINGSERVICE.TEST.JS
 * Unit tests for userProvisioningService
 */

// Mock dependencies BEFORE requiring the service
jest.mock('../src/config/db');
jest.mock('../src/services/keycloakService');
jest.mock('../src/services/emailService');

const userProvisioningService = require('../src/services/userProvisioningService');
const ProvisioningError = require('../src/errors/ProvisioningError');
const { prisma } = require('../src/config/db');
const keycloakService = require('../src/services/keycloakService');
const EmailService = require('../src/services/emailService');

describe('userProvisioningService', () => {
  let mockPrismaTransaction;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup Prisma transaction mock
    mockPrismaTransaction = {
      utilisateur: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      utilisateur_role: {
        create: jest.fn(),
      },
      gestionnaire_parking: {
        create: jest.fn(),
      },
      passager: {
        create: jest.fn(),
      },
      chauffeur: {
        create: jest.fn(),
      },
      proprietaire: {
        create: jest.fn(),
      },
      portefeuille: {
        create: jest.fn(),
      },
    };

    prisma.$transaction = jest.fn((cb) => cb(mockPrismaTransaction));
    prisma.utilisateur = mockPrismaTransaction.utilisateur;
  });

  describe('create() — Success cases', () => {
    test('should create gestionnaire successfully (Keycloak → PG)', async () => {
      const params = {
        email: 'gestionnaire@test.com',
        prenom: 'Jean',
        nom: 'Dupont',
        role: 'gestionnaire',
        numero_telephone: '+22670000001',
        metadata: { id_parking: 'parking-123' },
      };

      // Mock Keycloak user creation
      const mockKeycloakUserId = 'kc-uuid-1234';
      keycloakService.adminAPI.users.create = jest.fn().mockResolvedValue({
        id: mockKeycloakUserId,
      });

      keycloakService.adminAPI.roles.findOneByName = jest.fn().mockResolvedValue({
        id: 'role-id',
        name: 'ndjigi-gestionnaire',
      });

      keycloakService.adminAPI.users.addRealmRoleMappings = jest.fn().mockResolvedValue(undefined);

      // Mock PG user creation
      const mockPgUser = {
        id_utilisateur: 'pg-uuid-1234',
        email: params.email,
        keycloak_id: mockKeycloakUserId,
        utilisateur_role: [{ role: 'gestionnaire', actif: true }],
      };

      mockPrismaTransaction.utilisateur.findUnique.mockResolvedValue(null);
      mockPrismaTransaction.utilisateur.create.mockResolvedValue(mockPgUser);
      mockPrismaTransaction.gestionnaire_parking.create.mockResolvedValue({
        id_gestionnaire: mockPgUser.id_utilisateur,
        id_parking: 'parking-123',
      });
      mockPrismaTransaction.portefeuille.create.mockResolvedValue({
        id_utilisateur: mockPgUser.id_utilisateur,
      });

      // Mock email service
      EmailService.sendUserInvitation = jest.fn().mockResolvedValue(undefined);

      // Execute
      const result = await userProvisioningService.create(params);

      // Assertions
      expect(result).toEqual({
        id_utilisateur: 'pg-uuid-1234',
        keycloak_id: mockKeycloakUserId,
        email: params.email,
        prenom: params.prenom,
        nom: params.nom,
        role: 'gestionnaire',
        tempPassword: expect.any(String),
      });

      expect(keycloakService.adminAPI.users.create).toHaveBeenCalledWith({
        realm: process.env.KEYCLOAK_REALM,
        body: expect.objectContaining({
          email: params.email,
          firstName: params.prenom,
          lastName: params.nom,
          enabled: true,
          credentials: expect.arrayContaining([
            expect.objectContaining({
              type: 'password',
              temporary: true,
            }),
          ]),
        }),
      });

      expect(mockPrismaTransaction.utilisateur.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          keycloak_id: mockKeycloakUserId,
          email: params.email,
          role: 'gestionnaire',
          auth_provider: 'keycloak',
          utilisateur_role: expect.any(Object),
        }),
      });

      expect(EmailService.sendUserInvitation).toHaveBeenCalledWith(
        params.email,
        expect.objectContaining({
          nom: params.nom,
          prenom: params.prenom,
          role: 'gestionnaire',
          tempPassword: expect.any(String),
        })
      );
    });

    test('should create passager successfully with OTP auth', async () => {
      const params = {
        email: 'passager@test.com',
        prenom: 'Marie',
        nom: 'Martin',
        role: 'passager',
        numero_telephone: '+22670000002',
      };

      const mockKeycloakUserId = 'kc-uuid-5678';
      keycloakService.adminAPI.users.create = jest.fn().mockResolvedValue({
        id: mockKeycloakUserId,
      });

      keycloakService.adminAPI.roles.findOneByName = jest.fn().mockResolvedValue({
        id: 'role-id',
        name: 'ndjigi-passager',
      });

      keycloakService.adminAPI.users.addRealmRoleMappings = jest.fn().mockResolvedValue(undefined);

      const mockPgUser = {
        id_utilisateur: 'pg-uuid-5678',
        email: params.email,
        keycloak_id: mockKeycloakUserId,
        utilisateur_role: [{ role: 'passager', actif: true }],
      };

      mockPrismaTransaction.utilisateur.findUnique.mockResolvedValue(null);
      mockPrismaTransaction.utilisateur.create.mockResolvedValue(mockPgUser);
      mockPrismaTransaction.passager.create.mockResolvedValue({
        id_passager: mockPgUser.id_utilisateur,
      });
      mockPrismaTransaction.portefeuille.create.mockResolvedValue({
        id_utilisateur: mockPgUser.id_utilisateur,
      });

      EmailService.sendUserInvitation = jest.fn().mockResolvedValue(undefined);

      const result = await userProvisioningService.create(params);

      expect(result.role).toBe('passager');
      expect(mockPrismaTransaction.passager.create).toHaveBeenCalled();
    });

    test('should create system user without Keycloak', async () => {
      const params = {
        email: 'system@ndjigi.local',
        prenom: 'System',
        nom: 'User',
        role: 'admin',
        systemUser: true,
        sendInvitationEmail: false,
      };

      const mockPgUser = {
        id_utilisateur: 'pg-sys-001',
        email: params.email,
        keycloak_id: 'SYSTEM_NO_AUTH',
        utilisateur_role: [{ role: 'admin', actif: true }],
      };

      mockPrismaTransaction.utilisateur.findUnique.mockResolvedValue(null);
      mockPrismaTransaction.utilisateur.create.mockResolvedValue(mockPgUser);

      const result = await userProvisioningService.create(params);

      expect(result.keycloak_id).toBe('SYSTEM_NO_AUTH');
      // Keycloak should NOT be called for system users
      expect(keycloakService.adminAPI.users.create).not.toHaveBeenCalled();
      expect(EmailService.sendUserInvitation).not.toHaveBeenCalled();
    });
  });

  describe('create() — Error cases', () => {
    test('should throw EMAIL_EXISTS if email already in PG', async () => {
      const params = {
        email: 'existing@test.com',
        prenom: 'Test',
        nom: 'User',
        role: 'passager',
      };

      // Mock existing user in PG
      mockPrismaTransaction.utilisateur.findUnique.mockResolvedValue({
        id_utilisateur: 'existing-id',
        email: params.email,
      });

      await expect(userProvisioningService.create(params)).rejects.toThrow(ProvisioningError);
      await expect(userProvisioningService.create(params)).rejects.toMatchObject({
        code: 'EMAIL_EXISTS',
      });

      // Keycloak should NOT be called
      expect(keycloakService.adminAPI.users.create).not.toHaveBeenCalled();
    });

    test('should throw KEYCLOAK_ERROR if Keycloak creation fails', async () => {
      const params = {
        email: 'test@test.com',
        prenom: 'Test',
        nom: 'User',
        role: 'gestionnaire',
      };

      mockPrismaTransaction.utilisateur.findUnique.mockResolvedValue(null);

      // Mock Keycloak error
      keycloakService.adminAPI.users.create = jest.fn().mockRejectedValue(
        new Error('Keycloak server error')
      );

      await expect(userProvisioningService.create(params)).rejects.toThrow(ProvisioningError);
      await expect(userProvisioningService.create(params)).rejects.toMatchObject({
        code: 'KEYCLOAK_ERROR',
      });

      // PG create should NOT be called
      expect(mockPrismaTransaction.utilisateur.create).not.toHaveBeenCalled();
    });

    test('should rollback Keycloak if PG creation fails', async () => {
      const params = {
        email: 'test@test.com',
        prenom: 'Test',
        nom: 'User',
        role: 'gestionnaire',
      };

      const mockKeycloakUserId = 'kc-uuid-rollback';
      keycloakService.adminAPI.users.create = jest.fn().mockResolvedValue({
        id: mockKeycloakUserId,
      });

      keycloakService.adminAPI.roles.findOneByName = jest.fn().mockResolvedValue(null);

      mockPrismaTransaction.utilisateur.findUnique.mockResolvedValue(null);
      // PG create fails
      mockPrismaTransaction.utilisateur.create.mockRejectedValue(
        new Error('Unique constraint violation')
      );

      keycloakService.adminAPI.users.del = jest.fn().mockResolvedValue(undefined);

      await expect(userProvisioningService.create(params)).rejects.toThrow(ProvisioningError);
      await expect(userProvisioningService.create(params)).rejects.toMatchObject({
        code: 'PG_ERROR',
      });

      // Keycloak rollback should be called
      expect(keycloakService.adminAPI.users.del).toHaveBeenCalledWith({
        realm: process.env.KEYCLOAK_REALM,
        id: mockKeycloakUserId,
      });
    });

    test('should throw ROLLBACK_FAILED if both PG and KC rollback fail', async () => {
      const params = {
        email: 'test@test.com',
        prenom: 'Test',
        nom: 'User',
        role: 'gestionnaire',
      };

      const mockKeycloakUserId = 'kc-uuid-critical';
      keycloakService.adminAPI.users.create = jest.fn().mockResolvedValue({
        id: mockKeycloakUserId,
      });

      keycloakService.adminAPI.roles.findOneByName = jest.fn().mockResolvedValue(null);

      mockPrismaTransaction.utilisateur.findUnique.mockResolvedValue(null);
      mockPrismaTransaction.utilisateur.create.mockRejectedValue(
        new Error('PG constraint error')
      );

      keycloakService.adminAPI.users.del = jest.fn().mockRejectedValue(
        new Error('Keycloak deletion failed')
      );

      await expect(userProvisioningService.create(params)).rejects.toThrow(ProvisioningError);
      await expect(userProvisioningService.create(params)).rejects.toMatchObject({
        code: 'ROLLBACK_FAILED',
      });
    });
  });

  describe('email validation', () => {
    test('should normalize email (trim and lowercase)', async () => {
      const params = {
        email: '  TEST@EXAMPLE.COM  ',
        prenom: 'Test',
        nom: 'User',
        role: 'passager',
      };

      const mockKeycloakUserId = 'kc-uuid-normalize';
      keycloakService.adminAPI.users.create = jest.fn().mockResolvedValue({
        id: mockKeycloakUserId,
      });

      keycloakService.adminAPI.roles.findOneByName = jest.fn().mockResolvedValue(null);

      const mockPgUser = {
        id_utilisateur: 'pg-uuid-normalize',
        email: 'test@example.com',
        keycloak_id: mockKeycloakUserId,
        utilisateur_role: [{ role: 'passager', actif: true }],
      };

      mockPrismaTransaction.utilisateur.findUnique.mockResolvedValue(null);
      mockPrismaTransaction.utilisateur.create.mockResolvedValue(mockPgUser);
      mockPrismaTransaction.passager.create.mockResolvedValue({
        id_passager: mockPgUser.id_utilisateur,
      });
      mockPrismaTransaction.portefeuille.create.mockResolvedValue({
        id_utilisateur: mockPgUser.id_utilisateur,
      });

      EmailService.sendUserInvitation = jest.fn().mockResolvedValue(undefined);

      const result = await userProvisioningService.create(params);

      // Keycloak should be called with normalized email
      expect(keycloakService.adminAPI.users.create).toHaveBeenCalledWith({
        realm: process.env.KEYCLOAK_REALM,
        body: expect.objectContaining({
          email: 'test@example.com',
        }),
      });

      expect(result.email).toBe('test@example.com');
    });
  });

  describe('password generation', () => {
    test('should generate valid temporary password', () => {
      const password = userProvisioningService.generateTempPassword();

      expect(password).toHaveLength(12);
      // Check for complexity: must have uppercase, lowercase, digit, special
      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/[a-z]/.test(password)).toBe(true);
      expect(/[0-9]/.test(password)).toBe(true);
      expect(/[!@#$%^&*]/.test(password)).toBe(true);
    });

    test('should generate different password each time', () => {
      const pwd1 = userProvisioningService.generateTempPassword();
      const pwd2 = userProvisioningService.generateTempPassword();
      expect(pwd1).not.toBe(pwd2);
    });
  });
});
