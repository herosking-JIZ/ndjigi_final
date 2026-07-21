/**
 * ROUTES/KEYCLOAKAUTH ROUTES.JS
 * Routes pour Keycloak authentication (Phase 1+)
 *
 * Endpoints:
 *  POST /auth/login   - Login via Keycloak
 *  POST /auth/refresh - Refresh access token
 *  POST /auth/logout  - Logout
 *
 * Ces routes fonctionnent EN PARALLÈLE avec les anciennes routes JWT
 * jusqu'à ce qu'elles soient supprimées en Phase 4
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const KeycloakAuthController = require('../controllers/keycloakAuthController');
const AuthController = require('../controllers/authController');
const InvitationController = require('../controllers/invitationController');
const { forgotPasswordRules, resetPasswordRules } = require('../validators/authValidator');
const {
  forgotPasswordRateLimit,
  resetPasswordRateLimit
} = require('../middlewares/forgotPasswordRateLimit');
const joiValidate = require('../middlewares/validate.middleware');
const { firstConnectionSchema, resendInvitationSchema } = require('../validators/gestionnaireValidation');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

const router = express.Router();

// Rate limiting pour login (protection contre brute-force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Trop de tentatives. Réessayez dans 15 minutes.',
    code: 'RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false
});


// Rate limiting pour OTP request (1 per 60s per phone, max 5 per 24h)
const otpRequestLimiter = rateLimit({
  keyGenerator: (req) => req.body?.phone || ipKeyGenerator(req),
  windowMs: 60 * 1000, // 60 seconds
  max: 1,
  message: {
    success: false,
    message: 'Attendez 60 secondes avant de renvoyer.',
    code: 'OTP_RATE_LIMIT'
  },
  standardHeaders: false,
  legacyHeaders: false
});

// Daily limit for OTP requests (5 per 24h per phone)
const otpDailyLimiter = rateLimit({
  keyGenerator: (req) => `${req.body?.phone || ipKeyGenerator(req)}:daily`,
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5,
  message: {
    success: false,
    message: 'Limite quotidienne atteinte. Réessayez demain.',
    code: 'OTP_DAILY_LIMIT'
  },
  standardHeaders: false,
  legacyHeaders: false
});

/**
 * POST /auth/local/login
 * Body: { email, password }
 * Réponse: { access_token, refresh_token, user, expires_in, mot_de_passe_temporaire }
 * Used for: gestionnaires, admins, and other local email/password users
 */
router.post('/local/login', loginLimiter, async (req, res) => {
  await AuthController.localLogin(req, res);
});

/**
 * POST /auth/change-temporary-password
 * Change temporary password to permanent password
 * Auth: Bearer token required
 * Body: { ancien_mot_de_passe, nouveau_mot_de_passe }
 * Réponse: { success: true, data: { id_utilisateur } }
 */
router.post('/change-temporary-password', authenticate, async (req, res) => {
  await AuthController.changeTemporaryPassword(req, res);
});

/**
 * POST /auth/login
 * Body: { email, password }
 * Réponse: { access_token, refresh_token, user, expires_in } (Keycloak)
 * Fallback if Keycloak auth fails - tries local auth
 */
router.post('/login', loginLimiter, async (req, res) => {
  try {
    await KeycloakAuthController.login(req, res);
  } catch (error) {
    // If Keycloak login fails, try local login as fallback
    console.log(`⚠️ Keycloak login failed, trying local auth...`);
    await AuthController.localLogin(req, res);
  }
});

/**
 * POST /auth/refresh
 * Body: { refresh_token }
 * Réponse: { access_token, expires_in }
 */
router.post('/refresh', async (req, res) => {
  await KeycloakAuthController.refresh(req, res);
});

/**
 * POST /auth/logout
 * Body: { refresh_token }
 * Réponse: { success: true }
 */
router.post('/logout', async (req, res) => {
  await KeycloakAuthController.logout(req, res);
});

/**
 * POST /auth/verify-sms
 * Body: { login_token, sms_code }
 * Réponse: { access_token, refresh_token, user } ou erreur
 */
router.post('/verify-sms', async (req, res) => {
  await KeycloakAuthController.verifySms(req, res);
});

/**
 * POST /auth/resend-sms
 * Body: { login_token }
 * Réponse: { success: true } ou erreur de cooldown
 */
router.post('/resend-sms', async (req, res) => {
  await KeycloakAuthController.resendSms(req, res);
});

/**
 * POST /auth/forgot-password (Phase 7)
 * Body: { email }
 * Triggers Keycloak password reset email
 * Always returns 200 (prevent email enumeration)
 */
router.post('/forgot-password', forgotPasswordRateLimit, forgotPasswordRules, async (req, res) => {
  await KeycloakAuthController.forgotPassword(req, res);
});

/**
 * POST /auth/reset-password
 * Body: { token, newPassword }
 * Réponse: { success: true } ou erreur de token invalide
 */
router.post('/reset-password', resetPasswordRateLimit, resetPasswordRules, async (req, res) => {
  await KeycloakAuthController.resetPassword(req, res);
});

/**
 * POST /auth/admin/users
 * Body: { nom, prenom, email, mot_de_passe, role, numero_telephone, adresse, parking_id? }
 * Réponse: { success: true, data: user }
 */
router.post('/admin/users', async (req, res) => {
  await KeycloakAuthController.createUserByAdmin(req, res);
});

// ─── OTP Authentication (Phase 5) ─────────────────────

/**
 * POST /auth/otp/request
 * Request OTP code for phone-based authentication
 * Body: { phone }
 * Rate limited: 1 per 60s per phone, max 5 per 24h
 */
router.post(
  '/otp/request',
  otpRequestLimiter,
  otpDailyLimiter,
  async (req, res) => {
    await KeycloakAuthController.otpRequest(req, res);
  }
);

/**
 * POST /auth/otp/verify
 * Verify OTP and create/login user
 * Body: { phone, otp_code }
 */
router.post('/otp/verify', async (req, res) => {
  await KeycloakAuthController.otpVerify(req, res);
});

/**
 * POST /auth/otp/resend
 * Resend OTP code (60-second cooldown)
 * Body: { phone }
 */
router.post('/otp/resend', async (req, res) => {
  await KeycloakAuthController.otpResend(req, res);
});

// ─── TOTP 2FA (Phase 6) ─────────────────────

// Rate limiting for TOTP setup/verify attempts (prevent brute-force)
const totpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Trop de tentatives. Réessayez dans 15 minutes.',
    code: 'TOTP_RATE_LIMIT'
  },
  standardHeaders: false,
  legacyHeaders: false
});

/**
 * POST /auth/totp/setup
 * Register TOTP credential after OTP verification
 * Body: { login_token, totp_code }
 * Response: { access_token, refresh_token, user } or error
 */
router.post('/totp/setup', totpLimiter, async (req, res) => {
  await KeycloakAuthController.totpSetup(req, res);
});

/**
 * POST /auth/totp/verify
 * Verify TOTP code for existing 2FA
 * Body: { login_token, totp_code }
 * Response: { access_token, refresh_token, user } or error
 */
router.post('/totp/verify', totpLimiter, async (req, res) => {
  await KeycloakAuthController.totpVerify(req, res);
});

// ─── Gestionnaire Invitation System (Public Routes) ──────────

/**
 * GET /auth/verify-invitation?token=XXX
 * Verify invitation token is valid (PUBLIC)
 * Query: token=string (UUID)
 * Returns: { email, id_utilisateur, parking_nom }
 */
router.get('/verify-invitation', async (req, res) => {
  await InvitationController.verifyToken(req, res);
});

/**
 * POST /auth/complete-first-connection
 * Complete account activation - set password (PUBLIC)
 * Body: { token, email, nouveau_mot_de_passe, accepte_conditions }
 * Returns: { id_utilisateur, email, statut_compte }
 * Rate limited: 5 attempts per 15 min per token
 */
const firstConnectionLimiter = rateLimit({
  keyGenerator: (req) => `${req.body?.token || 'unknown'}_${ipKeyGenerator(req)}`,
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Trop de tentatives. Réessayez dans 15 minutes.',
    code: 'RATE_LIMIT'
  }
});

router.post(
  '/complete-first-connection',
  firstConnectionLimiter,
  joiValidate({ body: firstConnectionSchema }),
  async (req, res) => {
    await InvitationController.completeFirstConnection(req, res);
  }
);

/**
 * POST /auth/resend-invitation
 * Resend invitation email (ADMIN only)
 * Auth: Bearer token required
 * Body: { id_utilisateur }
 * Returns: { id_utilisateur, email, invitation_sent_at, invitation_expires_at }
 */
router.post(
  '/resend-invitation',
  authenticate,
  authorize('admin'),
  joiValidate({ body: resendInvitationSchema }),
  async (req, res) => {
    await InvitationController.resendInvitation(req, res);
  }
);

// ─── Admin User Management (Phase 7) ─────────────────────

/**
 * POST /api/v1/admin/gestionnaires (Phase 7)
 * Create gestionnaire account
 * Requires: ndjigi-admin role
 * Body: { email, nom, prenom, phone, parkings_assignes: string[] }
 * Returns: { success: true, data: {...} }
 */
router.post('/admin/gestionnaires', async (req, res) => {
  await KeycloakAuthController.createGestionnaire(req, res);
});

module.exports = router;
