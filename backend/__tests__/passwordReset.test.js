const request = require('supertest');
const express = require('express');
const nock = require('nock');

jest.mock('uuid', () => ({
  v4: jest.fn(() => '00000000-0000-4000-8000-000000000000')
}));

jest.mock('../src/config/redis', () => ({
  getRedisClient: jest.fn(() => ({
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    quit: jest.fn()
  }))
}));

jest.mock('../src/config/db', () => ({
  prisma: {
    utilisateur: {
      findUnique: jest.fn()
    },
    password_reset_token: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn()
    }
  },
  connectDB: jest.fn(),
  disconnectDB: jest.fn()
}));

jest.mock('../src/services/keycloakService', () => ({
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
  findUserByUsername: jest.fn(),
  adminAPI: {
    users: {
      find: jest.fn(),
      findOne: jest.fn(),
      resetPassword: jest.fn()
    }
  }
}));

jest.mock('../src/services/emailService', () => ({
  sendPasswordResetEmail: jest.fn(),
  sendPasswordChangedNotification: jest.fn()
}));

const { prisma } = require('../src/config/db');
const keycloakService = require('../src/services/keycloakService');
const EmailService = require('../src/services/emailService');
const KeycloakAuthController = require('../src/controllers/keycloakAuthController');
const { forgotPasswordRules, resetPasswordRules } = require('../src/validators/authValidator');
const {
  forgotPasswordRateLimit,
  resetPasswordRateLimit
} = require('../src/middlewares/forgotPasswordRateLimit');

function buildApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());

  app.post('/auth/forgot-password', forgotPasswordRateLimit, forgotPasswordRules, (req, res) =>
    KeycloakAuthController.forgotPassword(req, res)
  );

  app.post('/auth/reset-password', resetPasswordRateLimit, resetPasswordRules, (req, res) =>
    KeycloakAuthController.resetPassword(req, res)
  );

  return app;
}

describe('Password reset flow', () => {
  const app = buildApp();

  beforeAll(() => {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    keycloakService.adminAPI.users.find.mockResolvedValue([]);
    keycloakService.adminAPI.users.findOne.mockResolvedValue({ id: 'kc-user-1' });
    keycloakService.adminAPI.users.resetPassword.mockResolvedValue({});

    EmailService.sendPasswordResetEmail.mockResolvedValue({ messageId: 'mail-1' });
    EmailService.sendPasswordChangedNotification.mockResolvedValue({ messageId: 'mail-2' });

    prisma.password_reset_token.deleteMany.mockResolvedValue({ count: 0 });
    prisma.password_reset_token.create.mockResolvedValue({ id: 'reset-id-1' });
    prisma.password_reset_token.findUnique.mockResolvedValue(null);
    prisma.password_reset_token.delete.mockResolvedValue({ id: 'reset-id-1' });
    prisma.password_reset_token.update.mockResolvedValue({ id: 'reset-id-1' });
  });

  test('POST /forgot-password with unknown email -> 200 generic and no email sent', async () => {
    prisma.utilisateur.findUnique.mockResolvedValue(null);
    keycloakService.adminAPI.users.find.mockResolvedValue([]);

    const res = await request(app)
      .post('/auth/forgot-password')
      .set('X-Forwarded-For', '10.0.0.1')
      .send({ email: 'unknown@example.com' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(EmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  test('POST /forgot-password with valid active email -> 200 generic, email sent, token created', async () => {
    prisma.utilisateur.findUnique.mockResolvedValue({
      id_utilisateur: 'user-1',
      email: 'user@example.com',
      prenom: 'Awa',
      keycloak_id: 'kc-user-1',
      statut_compte: 'actif'
    });
    keycloakService.adminAPI.users.findOne.mockResolvedValue({ id: 'kc-user-1' });

    const res = await request(app)
      .post('/auth/forgot-password')
      .set('X-Forwarded-For', '10.0.0.2')
      .send({ email: 'user@example.com' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(prisma.password_reset_token.create).toHaveBeenCalledTimes(1);
    expect(EmailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });

  test('POST /forgot-password with suspended account -> 200 generic and no email sent', async () => {
    prisma.utilisateur.findUnique.mockResolvedValue({
      id_utilisateur: 'user-2',
      email: 'suspended@example.com',
      prenom: 'Kader',
      keycloak_id: 'kc-user-2',
      statut_compte: 'suspendu'
    });

    const res = await request(app)
      .post('/auth/forgot-password')
      .set('X-Forwarded-For', '10.0.0.3')
      .send({ email: 'suspended@example.com' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(EmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(prisma.password_reset_token.create).not.toHaveBeenCalled();
  });

  test('POST /forgot-password 4 times same IP quickly -> 4th is 429', async () => {
    prisma.utilisateur.findUnique.mockResolvedValue(null);
    keycloakService.adminAPI.users.find.mockResolvedValue([]);

    const payload = { email: 'rate@example.com' };
    await request(app).post('/auth/forgot-password').set('X-Forwarded-For', '10.0.0.44').send(payload).expect(200);
    await request(app).post('/auth/forgot-password').set('X-Forwarded-For', '10.0.0.44').send(payload).expect(200);
    await request(app).post('/auth/forgot-password').set('X-Forwarded-For', '10.0.0.44').send(payload).expect(200);

    const res = await request(app)
      .post('/auth/forgot-password')
      .set('X-Forwarded-For', '10.0.0.44')
      .send(payload)
      .expect(429);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Trop de tentatives');
  });

  test('POST /reset-password with invalid token -> 400', async () => {
    prisma.password_reset_token.findUnique.mockResolvedValue(null);

    await request(app)
      .post('/auth/reset-password')
      .set('X-Forwarded-For', '10.0.0.5')
      .send({
        token: '11111111-1111-4111-8111-111111111111',
        newPassword: 'StrongPassword!123'
      })
      .expect(400);
  });

  test('POST /reset-password with expired token -> 400 and token deleted', async () => {
    prisma.password_reset_token.findUnique.mockResolvedValue({
      id: 'reset-expired',
      id_utilisateur: 'user-3',
      keycloak_id: 'kc-user-3',
      expires_at: new Date(Date.now() - 60 * 1000),
      used_at: null,
      utilisateur: {
        id_utilisateur: 'user-3',
        email: 'expired@example.com',
        prenom: 'Issa',
        keycloak_id: 'kc-user-3'
      }
    });

    await request(app)
      .post('/auth/reset-password')
      .set('X-Forwarded-For', '10.0.0.6')
      .send({
        token: '22222222-2222-4222-8222-222222222222',
        newPassword: 'StrongPassword!123'
      })
      .expect(400);

    expect(prisma.password_reset_token.delete).toHaveBeenCalledTimes(1);
  });

  test('POST /reset-password with used token -> 400 and warn log', async () => {
    prisma.password_reset_token.findUnique.mockResolvedValue({
      id: 'reset-used',
      id_utilisateur: 'user-4',
      keycloak_id: 'kc-user-4',
      expires_at: new Date(Date.now() + 5 * 60 * 1000),
      used_at: new Date(Date.now() - 1000),
      utilisateur: {
        id_utilisateur: 'user-4',
        email: 'used@example.com',
        prenom: 'Moussa',
        keycloak_id: 'kc-user-4'
      }
    });

    await request(app)
      .post('/auth/reset-password')
      .set('X-Forwarded-For', '10.0.0.7')
      .send({
        token: '33333333-3333-4333-8333-333333333333',
        newPassword: 'StrongPassword!123'
      })
      .expect(400);

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('"event":"reset_password_token_already_used"'));
  });

  test('POST /reset-password with weak password -> 400 and violations list', async () => {
    const res = await request(app)
      .post('/auth/reset-password')
      .set('X-Forwarded-For', '10.0.0.8')
      .send({
        token: '44444444-4444-4444-8444-444444444444',
        newPassword: 'abc'
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors?.violations)).toBe(true);
    expect(res.body.errors.violations.length).toBeGreaterThan(0);
  });

  test('POST /reset-password with valid data -> 200, keycloak updated, token used, notification sent', async () => {
    prisma.password_reset_token.findUnique.mockResolvedValue({
      id: 'reset-valid',
      id_utilisateur: 'user-5',
      keycloak_id: 'kc-user-5',
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
      used_at: null,
      utilisateur: {
        id_utilisateur: 'user-5',
        email: 'valid@example.com',
        prenom: 'Aicha',
        keycloak_id: 'kc-user-5'
      }
    });
    keycloakService.adminAPI.users.findOne.mockResolvedValue({ id: 'kc-user-5' });
    keycloakService.adminAPI.users.resetPassword.mockResolvedValue({});
    prisma.password_reset_token.update.mockResolvedValue({ id: 'reset-valid' });

    const res = await request(app)
      .post('/auth/reset-password')
      .set('X-Forwarded-For', '10.0.0.9')
      .set('User-Agent', 'Mozilla/5.0 Test Browser')
      .send({
        token: '55555555-5555-4555-8555-555555555555',
        newPassword: 'StrongPassword!123'
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(keycloakService.adminAPI.users.resetPassword).toHaveBeenCalledTimes(1);
    expect(prisma.password_reset_token.update).toHaveBeenCalledTimes(1);
    expect(EmailService.sendPasswordChangedNotification).toHaveBeenCalledTimes(1);
  });

  test('Desync case: user exists in Keycloak but not in PG -> 200 generic and error log', async () => {
    prisma.utilisateur.findUnique.mockResolvedValue(null);
    keycloakService.adminAPI.users.find.mockResolvedValue([{ id: 'kc-only-user' }]);

    const res = await request(app)
      .post('/auth/forgot-password')
      .set('X-Forwarded-For', '10.0.0.10')
      .send({ email: 'keycloak-only@example.com' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('"event":"forgot_password_desync_keycloak_without_pg"'));
  });
});
