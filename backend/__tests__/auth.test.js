/**
 * Authentication Tests
 * Backend integration tests for all auth endpoints
 * Tests: OTP, TOTP, JWT, Authorization, Rate Limiting
 */

const request = require('supertest');
const nock = require('nock');

// Mock Redis before requiring app
jest.mock('ioredis', () => {
  const RedisMock = require('ioredis-mock');
  return RedisMock;
});

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    utilisateur: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    gestionnaire_parking: {
      create: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    parking: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    auth_log: {
      create: jest.fn(),
    },
  })),
}));

// Mock email service
jest.mock('../src/services/emailService', () => ({
  sendGestionnaireWelcome: jest.fn().mockResolvedValue({ messageId: 'test' }),
  sendTest: jest.fn().mockResolvedValue({ messageId: 'test' }),
}));

// Mock OTP service
jest.mock('../src/services/otpService', () => ({
  generateOtp: jest.fn(() => '123456'),
  storeOtp: jest.fn().mockResolvedValue(undefined),
  verifyOtp: jest.fn().mockResolvedValue(true),
  resendOtp: jest.fn().mockResolvedValue(undefined),
  isPhoneBlocked: jest.fn().mockResolvedValue(false),
}));

// Mock TOTP service
jest.mock('../src/services/totpService', () => ({
  generateSecret: jest.fn(() => ({
    secret: 'JBSWY3DPEBLW64TMMQ======',
    qr_code_url: 'otpauth://totp/test@example.com?secret=...',
  })),
  verify: jest.fn((secret, token) => token === '123456'),
  generate: jest.fn(() => '123456'),
  parseOtpauthUrl: jest.fn((url) => 'JBSWY3DPEBLW64TMMQ======'),
}));

// Mock Keycloak Admin API
jest.mock('../src/config/keycloak', () => ({
  keycloakService: {
    adminAPI: {
      users: {
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue({ id: 'user-uuid' }),
        create: jest.fn().mockResolvedValue({ id: 'new-user-uuid' }),
        del: jest.fn().mockResolvedValue({}),
        executeActionsEmail: jest.fn().mockResolvedValue({}),
        addRealmRoleMappings: jest.fn().mockResolvedValue({}),
      },
      roles: {
        findOneByName: jest.fn().mockResolvedValue({ id: 'role-uuid' }),
      },
      realms: {
        findOne: jest.fn().mockResolvedValue({ name: 'ndjigi' }),
      },
    },
    client: {
      grant: jest.fn().mockResolvedValue({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 300,
        token_type: 'Bearer',
      }),
    },
  },
}));

// Now require the app after mocks are set up
let app;
const mockRedis = require('ioredis');

describe('Authentication API', () => {
  beforeAll(() => {
    // Mock express app for testing
    const express = require('express');
    app = express();
    app.use(express.json());

    // Require controller (after mocks)
    const keycloakAuthController = require('../src/controllers/keycloakAuthController');

    // Setup basic routes for testing
    app.post('/auth/otp/request', (req, res) =>
      keycloakAuthController.otpRequest(req, res)
    );
    app.post('/auth/otp/verify', (req, res) =>
      keycloakAuthController.otpVerify(req, res)
    );
    app.post('/auth/otp/resend', (req, res) =>
      keycloakAuthController.otpResend(req, res)
    );
    app.post('/auth/totp/setup', (req, res) =>
      keycloakAuthController.totpSetup(req, res)
    );
    app.post('/auth/totp/verify', (req, res) =>
      keycloakAuthController.totpVerify(req, res)
    );
    app.post('/auth/forgot-password', (req, res) =>
      keycloakAuthController.forgotPassword(req, res)
    );
    app.post('/auth/admin/gestionnaires', (req, res) =>
      keycloakAuthController.createGestionnaire(req, res)
    );
  });

  afterEach(() => {
    nock.cleanAll();
    jest.clearAllMocks();
  });

  // ──── OTP Tests ────────────────────────────────────────

  describe('OTP Authentication', () => {
    test('POST /auth/otp/request - Success', async () => {
      const response = await request(app)
        .post('/auth/otp/request')
        .send({ phone: '+22670123456' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.phone_masked).toBeDefined();
    });

    test('POST /auth/otp/request - Invalid phone', async () => {
      const response = await request(app)
        .post('/auth/otp/request')
        .send({ phone: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('POST /auth/otp/verify - Success', async () => {
      // Store OTP first
      await request(app).post('/auth/otp/request').send({ phone: '+22670123456' });

      const response = await request(app)
        .post('/auth/otp/verify')
        .send({
          phone: '+22670123456',
          otp_code: '123456',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.access_token).toBeDefined();
      expect(response.body.data.refresh_token).toBeDefined();
    });

    test('POST /auth/otp/verify - Wrong code', async () => {
      await request(app).post('/auth/otp/request').send({ phone: '+22670123456' });

      const response = await request(app)
        .post('/auth/otp/verify')
        .send({
          phone: '+22670123456',
          otp_code: '000000',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('POST /auth/otp/resend - Success', async () => {
      await request(app).post('/auth/otp/request').send({ phone: '+22670123456' });

      // Wait a bit for cooldown
      await new Promise((r) => setTimeout(r, 100));

      const response = await request(app)
        .post('/auth/otp/resend')
        .send({ phone: '+22670123456' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('POST /auth/otp/resend - Cooldown not respected', async () => {
      await request(app).post('/auth/otp/request').send({ phone: '+22670123456' });

      const response = await request(app)
        .post('/auth/otp/resend')
        .send({ phone: '+22670123456' })
        .expect(429);

      expect(response.body.code).toBe('RESEND_COOLDOWN');
    });
  });

  // ──── TOTP Tests ───────────────────────────────────────

  describe('TOTP 2FA', () => {
    test('POST /auth/totp/setup - Success', async () => {
      // First, setup a login session in Redis
      const redis = new mockRedis();
      await redis.setex(
        'login:test-token',
        300,
        JSON.stringify({
          keycloak_id: 'user-uuid',
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          expires_in: 300,
          user_id: 'local-user-id',
        })
      );

      const response = await request(app)
        .post('/auth/totp/setup')
        .send({
          login_token: 'test-token',
          totp_code: '123456',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.access_token).toBeDefined();

      await redis.quit();
    });

    test('POST /auth/totp/setup - Invalid code', async () => {
      const redis = new mockRedis();
      await redis.setex(
        'login:test-token-2',
        300,
        JSON.stringify({
          keycloak_id: 'user-uuid',
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          expires_in: 300,
          user_id: 'local-user-id',
        })
      );

      const response = await request(app)
        .post('/auth/totp/setup')
        .send({
          login_token: 'test-token-2',
          totp_code: '000000',
        })
        .expect(400);

      expect(response.body.success).toBe(false);

      await redis.quit();
    });

    test('POST /auth/totp/verify - Success', async () => {
      const redis = new mockRedis();
      await redis.setex(
        'login:test-token-3',
        300,
        JSON.stringify({
          keycloak_id: 'user-uuid',
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          expires_in: 300,
          user_id: 'local-user-id',
          attempts: 0,
        })
      );

      const response = await request(app)
        .post('/auth/totp/verify')
        .send({
          login_token: 'test-token-3',
          totp_code: '123456',
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      await redis.quit();
    });

    test('POST /auth/totp/verify - Max attempts exceeded', async () => {
      const redis = new mockRedis();
      await redis.setex(
        'login:test-token-4',
        300,
        JSON.stringify({
          keycloak_id: 'user-uuid',
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          expires_in: 300,
          user_id: 'local-user-id',
          attempts: 2,
        })
      );

      const response = await request(app)
        .post('/auth/totp/verify')
        .send({
          login_token: 'test-token-4',
          totp_code: '000000',
        })
        .expect(401);

      expect(response.body.code).toBe('TOTP_BLOCKED');

      await redis.quit();
    });
  });

  // ──── Password Reset Tests ─────────────────────────────

  describe('Password Reset', () => {
    test('POST /auth/forgot-password - Always 200 (security)', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('email');
    });

    test('POST /auth/forgot-password - Valid email triggers action', async () => {
      const { keycloakService } = require('../src/config/keycloak');

      keycloakService.adminAPI.users.find.mockResolvedValueOnce([
        { id: 'user-uuid', email: 'test@example.com' },
      ]);

      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(keycloakService.adminAPI.users.executeActionsEmail).toHaveBeenCalled();
    });
  });

  // ──── Admin Gestionnaire Tests ─────────────────────────

  describe('Admin: Create Gestionnaire', () => {
    test('POST /auth/admin/gestionnaires - Success', async () => {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      prisma.parking.findMany.mockResolvedValueOnce([
        { id_parking: 'parking-1', nom: 'Parking Central', adresse: '123 Ave' },
      ]);

      prisma.utilisateur.create.mockResolvedValueOnce({
        id_utilisateur: 'user-uuid',
        email: 'gest@example.com',
      });

      const response = await request(app)
        .post('/auth/admin/gestionnaires')
        .send({
          email: 'gest@example.com',
          nom: 'Dupont',
          prenom: 'Jean',
          phone: '+226 70 123456',
          parkings_assignes: ['parking-1'],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('gest@example.com');
    });

    test('POST /auth/admin/gestionnaires - Missing fields', async () => {
      const response = await request(app)
        .post('/auth/admin/gestionnaires')
        .send({
          email: 'gest@example.com',
          nom: 'Dupont',
          // Missing prenom
          phone: '+226 70 123456',
          parkings_assignes: ['parking-1'],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('POST /auth/admin/gestionnaires - No parkings', async () => {
      const response = await request(app)
        .post('/auth/admin/gestionnaires')
        .send({
          email: 'gest@example.com',
          nom: 'Dupont',
          prenom: 'Jean',
          phone: '+226 70 123456',
          parkings_assignes: [], // Empty
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('NO_PARKINGS');
    });

    test('POST /auth/admin/gestionnaires - Invalid parkings', async () => {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      prisma.parking.findMany.mockResolvedValueOnce([]); // No parkings found

      const response = await request(app)
        .post('/auth/admin/gestionnaires')
        .send({
          email: 'gest@example.com',
          nom: 'Dupont',
          prenom: 'Jean',
          phone: '+226 70 123456',
          parkings_assignes: ['invalid-parking'],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_PARKINGS');
    });
  });

  // ──── Rate Limiting Tests ──────────────────────────────

  describe('Rate Limiting', () => {
    test('Rate limit on OTP requests', async () => {
      const requests = [];
      for (let i = 0; i < 6; i++) {
        requests.push(
          request(app)
            .post('/auth/otp/request')
            .send({ phone: `+226701234${i}` })
        );
      }

      const responses = await Promise.all(requests);

      // First 1 should succeed, rest (2-6) should fail
      expect(responses[0].status).toBe(200);
      expect(responses[1].status).toBe(429);
    });
  });

  // ──── Error Handling Tests ─────────────────────────────

  describe('Error Handling', () => {
    test('Invalid JSON body', async () => {
      const response = await request(app)
        .post('/auth/otp/request')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body).toBeDefined();
    });

    test('Missing required fields', async () => {
      const response = await request(app)
        .post('/auth/otp/request')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('Endpoint not found returns 404', async () => {
      const response = await request(app).get('/auth/nonexistent').expect(404);

      expect(response.status).toBe(404);
    });
  });
});

describe('Integration Tests', () => {
  test('Full OTP flow: request → verify → tokens', async () => {
    const steps = [];

    // Step 1: Request OTP
    const reqRes = await request(app)
      .post('/auth/otp/request')
      .send({ phone: '+22670111111' });

    steps.push({
      step: 'request',
      status: reqRes.status,
      masked: reqRes.body.data?.phone_masked,
    });

    // Step 2: Verify OTP
    const verifyRes = await request(app)
      .post('/auth/otp/verify')
      .send({
        phone: '+22670111111',
        otp_code: '123456',
      });

    steps.push({
      step: 'verify',
      status: verifyRes.status,
      hasTokens: !!verifyRes.body.data?.access_token,
    });

    expect(steps[0].status).toBe(200);
    expect(steps[1].status).toBe(200);
    expect(steps[1].hasTokens).toBe(true);
  });
});
