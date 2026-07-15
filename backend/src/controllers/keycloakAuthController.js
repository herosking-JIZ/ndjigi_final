/**
 * CONTROLLERS/KEYCLOAKAUTH CONTROLLER.JS
 * Endpoints pour l'authentification Keycloak
 *
 * Routes:
 *  POST /auth/login        { email, password } → { access_token, refresh_token, user, expires_in } | { requires_2fa, login_token }
 *  POST /auth/refresh      { refresh_token } → { access_token, expires_in }
 *  POST /auth/logout       { refresh_token } → { success: true }
 *  POST /auth/verify-sms   { login_token, sms_code } → { access_token, refresh_token, user }
 *  POST /auth/resend-sms   { login_token } → { success: true }
 */

const keycloakService = require('../services/keycloakService');
const smsService = require('../services/smsService');
const otpService = require('../services/otpService');
const phoneService = require('../services/phoneService');
const totpService = require('../services/totpService');
const { prisma } = require('../config/db');
const { getRedisClient } = require('../config/redis');
const redis = getRedisClient();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { encrypt, decrypt, generateTechPassword } = require('../utils/crypto');
const EmailService = require('../services/emailService');
const { validatePasswordStrength } = require('../utils/passwordValidator');
const logger = require('../utils/logger');
const { provisionRoleProfile } = require('../services/provisioning.service');

const PASSWORD_RESET_TOKEN_TTL_MINUTES = parseInt(
  process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || '15',
  10
);

function logStructured(level, payload) {
  const logger = console[level] || console.log;
  logger(JSON.stringify(payload));
}

function normalizeEmail(value) {
  return (value || '').trim().toLowerCase();
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.ip || 'unknown';
}

const KeycloakAuthController = {
  /**
   * POST /auth/login
   * Authentifie un utilisateur via Keycloak
   * Si admin/gestionnaire: retourne requires_2fa=true + login_token (sans les vrais tokens)
   * Sinon: retourne les tokens directement
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      console.log(`🔐 Login attempt for: ${email}`);

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email et mot de passe requis.',
          code: 'MISSING_FIELDS'
        });
      }

      // 1️⃣ Appeler Keycloak pour obtenir les tokens
      console.log('📡 Calling Keycloak...');
      const kcTokens = await keycloakService.login(email, password);
      console.log('✅ Keycloak tokens received:', { access_token: kcTokens.access_token ? '***' : 'missing', refresh_token: kcTokens.refresh_token ? '***' : 'missing' });

      // 2️⃣ Décoder le access token pour récupérer les données utilisateur
      console.log('🔓 Decoding JWT token...');
      // ✅ SAFE: Token reçu directement de Keycloak (serveur→serveur), pas d'input client
      // La signature a déjà été validée par Keycloak. Ce decode extrait juste les claims.
      const decoded = jwt.decode(kcTokens.access_token);

      if (!decoded) {
        console.error('❌ Failed to decode JWT token');
        return res.status(500).json({
          success: false,
          message: 'Erreur lors du décodage du token.',
          code: 'TOKEN_DECODE_ERROR'
        });
      }

      const { sub: keycloak_id, given_name, family_name, realm_access } = decoded;
      // Extract relevant application roles (filter out offline_access, uma_authorization, etc.)
      const allRoles = realm_access?.roles || [];
      const keycloakRoles = allRoles.filter(r =>
        r === 'admin' || r === 'gestionnaire' || r === 'passager' || r === 'chauffeur' || r === 'proprietaire' ||
        r === 'ndjigi-admin' || r === 'ndjigi-gestionnaire' || r === 'ndjigi-passager' || r === 'ndjigi-chauffeur' || r === 'ndjigi-proprietaire'
      );
      console.log(`👤 User: ${keycloak_id}, Roles: ${keycloakRoles.join(', ') || 'none'}`);
      console.log(`📋 All realm_access.roles:`, allRoles);

      // 3️⃣ Map Keycloak roles to local role
      // Map from Keycloak role names to local DB role names
      const roleMapping = {
        'ndjigi-admin': 'admin',
        'admin': 'admin',
        'gestionnaire': 'gestionnaire',
        'ndjigi-gestionnaire': 'gestionnaire',
        'passager': 'passager',
        'ndjigi-passager': 'passager',
        'chauffeur': 'chauffeur',
        'ndjigi-chauffeur': 'chauffeur',
        'proprietaire': 'proprietaire',
        'ndjigi-proprietaire': 'proprietaire'
      };

      // Rôle strictement résolu depuis Keycloak — jamais de valeur devinée pour une création.
      let resolvedRole = null;
      for (const kcRole of keycloakRoles) {
        if (roleMapping[kcRole]) {
          resolvedRole = roleMapping[kcRole];
          break;
        }
      }
      // `localRole` garde un défaut 'passager' uniquement pour les gates 2FA/mobile-only
      // plus bas, sur des utilisateurs déjà existants — jamais utilisé pour créer un compte.
      const localRole = resolvedRole || 'passager';

      // Récupérer ou créer l'utilisateur en BDD locale
      let user = await prisma.utilisateur.findUnique({
        where: { keycloak_id }
      });

      if (!user) {
        if (!resolvedRole) {
          console.error(`❌ Utilisateur Keycloak ${keycloak_id} (${email}) sans rôle applicatif exploitable.`);
          return res.status(403).json({
            success: false,
            message: 'Compte Keycloak sans rôle applicatif assigné. Contactez un administrateur.',
            code: 'NO_ROLE_ASSIGNED'
          });
        }

        // Auto-provisioning avec le rôle réellement attribué dans Keycloak (jamais un défaut)
        user = await prisma.$transaction(async (tx) => {
          const created = await tx.utilisateur.create({
            data: {
              keycloak_id,
              email,
              prenom: given_name || '',
              nom: family_name || '',
              mot_de_passe_hash: '', // Keycloak users don't use local passwords
              numero_telephone: `temp-${keycloak_id.substring(0, 8)}`,
              auth_provider: 'keycloak',
              utilisateur_role: {
                create: {
                  role: resolvedRole,
                  actif: true
                }
              }
            },
            include: {
              utilisateur_role: { where: { actif: true } }
            }
          });

          await provisionRoleProfile(tx, created.id_utilisateur, resolvedRole);

          return created;
        });

        console.log(`✅ Auto-provisioning user during login: ${keycloak_id}, role: ${resolvedRole}`);
      } else if (user.utilisateur_role && user.utilisateur_role.length > 0) {
        // User exists: sync role if Keycloak role was found
        if (keycloakRoles.length > 0 && user.utilisateur_role[0].role !== localRole) {
          // Delete old role and create new one (role is part of composite key)
          await prisma.$transaction([
            prisma.utilisateur_role.deleteMany({
              where: { id_utilisateur: user.id_utilisateur }
            }),
            prisma.utilisateur_role.create({
              data: {
                id_utilisateur: user.id_utilisateur,
                role: localRole,
                actif: true
              }
            })
          ]);
          console.log(`✅ Synchronized role for user ${keycloak_id}: ${localRole}`);
        }
      }

      // Reload user to ensure we have the latest role
      user = await prisma.utilisateur.findUnique({
        where: { keycloak_id },
        include: { utilisateur_role: { where: { actif: true } } }
      });

      // 4️⃣ Vérifier les rôles et déterminer si 2FA requis
      // Utiliser les rôles locaux (synced from Keycloak)
      const localRoles = (user.utilisateur_role || []).map((ur) => ur.role);
      const requires2FA = localRole === 'admin' || localRole === 'gestionnaire';

      // Check if user's role is mobile-only (web access not allowed)
      const mobileOnlyRoles = ['passager', 'chauffeur', 'proprietaire'];
      if (mobileOnlyRoles.includes(localRole)) {
        return res.status(403).json({
          success: false,
          message: 'Accès web non disponible pour ce rôle. Utilisez l\'application mobile.',
          code: 'MOBILE_ONLY_ROLE',
          data: null
        });
      }

      // ─── Si 2FA requis : ne pas retourner les tokens, générer login_token ───
      if (requires2FA) {
        const loginToken = uuidv4();
        const otp = crypto.randomInt(100000, 999999).toString();
        const phone = user.numero_telephone || `temp-${keycloak_id.substring(0, 8)}`;

        // Stocker en Redis : key="login:<login_token>", TTL=5min
        await redis.setex(
          `login:${loginToken}`,
          300, // 5 minutes
          JSON.stringify({
            access_token: kcTokens.access_token,
            refresh_token: kcTokens.refresh_token,
            expires_in: kcTokens.expires_in,
            token_type: kcTokens.token_type,
            otp,
            phone,
            attempts: 0,
            user_id: user.id_utilisateur,
            created_at: Math.floor(Date.now() / 1000)
          })
        );

        // Envoyer SMS
        await smsService.send(phone, otp);

        // Masquer le téléphone : +226 ** ** ** 56
        const phoneMasked = phone.length >= 4
          ? phone.slice(0, -4).replace(/\d(?=\d{0,2}$)/g, '*') + phone.slice(-4)
          : '****';

        return res.json({
          success: true,
          message: 'Code OTP envoyé par SMS.',
          data: {
            requires_2fa: true,
            login_token: loginToken,
            phone_masked: phoneMasked,
            mot_de_passe_temporaire: user.mot_de_passe_temporaire || false
          }
        });
      }

      // ─── Pas de 2FA : retourner les tokens directement ───
      res.json({
        success: true,
        message: 'Connexion réussie.',
        data: {
          requires_2fa: false,
          access_token: kcTokens.access_token,
          refresh_token: kcTokens.refresh_token,
          expires_in: kcTokens.expires_in,
          token_type: kcTokens.token_type,
          mot_de_passe_temporaire: user.mot_de_passe_temporaire || false,
          user: {
            id_utilisateur: user.id_utilisateur,
            keycloak_id: user.keycloak_id,
            email: user.email,
            nom: user.nom,
            prenom: user.prenom,
            numero_telephone: user.numero_telephone,
            photo_profil: user.photo_profil,
            roles: localRoles.length > 0 ? localRoles : ['passager'],
            auth_provider: 'keycloak'
          }
        }
      });
    } catch (error) {
      // OAuth client-level misconfiguration (wrong/stale KEYCLOAK_CLIENT_SECRET, disabled client,
      // etc.) is an operator/config bug, NOT a user auth failure — never disguise it as a wrong
      // password, since that masks the real problem from whoever is debugging.
      const isClientAuthFailure = error.keycloakErrorCode === 'invalid_client_credentials'
        || error.keycloakErrorCode === 'invalid_client';

      if (isClientAuthFailure) {
        logger.error({
          event: 'keycloak_client_auth_failure',
          message: error.message,
          keycloakErrorCode: error.keycloakErrorCode
        });
        return res.status(500).json({
          success: false,
          message: "Erreur de configuration du service d'authentification.",
          code: 'AUTH_SERVICE_MISCONFIGURED',
          data: null
        });
      }

      console.error('❌ Login error:', error.message);
      console.error('Stack:', error.stack);

      // Genuine end-user credential failure
      if (error.keycloakErrorCode === 'invalid_grant' || error.message.includes('Invalid user credentials')) {
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect.',
          code: 'INVALID_CREDENTIALS',
          data: null
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la connexion.',
        code: 'LOGIN_ERROR',
        data: null
      });
    }
  },

  /**
   * POST /auth/refresh
   * Renouvelle l'access token
   */
  async refresh(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token requis.',
          code: 'MISSING_REFRESH_TOKEN'
        });
      }

      // Appeler Keycloak pour renouveler le token
      const kcTokens = await keycloakService.refresh(refresh_token);

      res.json({
        success: true,
        data: {
          access_token: kcTokens.access_token,
          refresh_token: kcTokens.refresh_token,
          expires_in: kcTokens.expires_in,
          token_type: kcTokens.token_type
        }
      });
    } catch (error) {
      console.error('❌ Refresh error:', error.message);

      res.status(401).json({
        success: false,
        message: 'Refresh token invalide ou expiré.',
        code: 'REFRESH_FAILED'
      });
    }
  },

  /**
   * POST /auth/logout
   * Invalide la session côté Keycloak et ajoute le token à la blacklist
   */
  async logout(req, res) {
    try {
      const { refresh_token, access_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token requis.',
          code: 'MISSING_REFRESH_TOKEN'
        });
      }

      // Invalider la session Keycloak
      await keycloakService.logout(refresh_token);

      // Blacklist tokens (si access_token fourni)
      if (access_token) {
        try {
          // ✅ SAFE: Token fourni en paramètre depuis une requête authentifiée
          // Utilisé uniquement pour extraire l'expiration et le jti (TTL blacklist)
          const decoded = jwt.decode(access_token);
          if (decoded && decoded.exp) {
            const now = Math.floor(Date.now() / 1000);
            const ttl = Math.max(decoded.exp - now, 0);
            if (ttl > 0) {
              const jti = decoded.jti || decoded.sub;
              await redis.setex(`blacklist:${jti}`, ttl, '1');
            }
          }
        } catch (e) {
          console.warn('⚠️ Could not add token to blacklist:', e.message);
        }
      }

      res.json({
        success: true,
        message: 'Déconnexion réussie.'
      });
    } catch (error) {
      console.error('❌ Logout error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la déconnexion.',
        code: 'LOGOUT_ERROR'
      });
    }
  },

  /**
   * POST /auth/verify-sms
   * Vérifie le code OTP et retourne les tokens
   */
  async verifySms(req, res) {
    try {
      const { login_token, sms_code } = req.body;

      if (!login_token || !sms_code) {
        return res.status(400).json({
          success: false,
          message: 'login_token et sms_code requis.',
          code: 'MISSING_FIELDS'
        });
      }

      // 1️⃣ Lire la session 2FA depuis Redis
      const sessionData = await redis.get(`login:${login_token}`);

      if (!sessionData) {
        return res.status(400).json({
          success: false,
          message: 'Session SMS expirée ou invalide.',
          code: 'SESSION_EXPIRED'
        });
      }

      // Vérifier si bloqué après 3 tentatives
      const blocked = await redis.exists(`blocked:login:${login_token}`);
      if (blocked) {
        return res.status(429).json({
          success: false,
          message: 'Trop de tentatives. Réessayez dans 15 minutes.',
          code: 'BLOCKED_TEMPORARILY'
        });
      }

      const session = JSON.parse(sessionData);
      const { otp, access_token, refresh_token, expires_in, token_type, user_id, phone, attempts } = session;

      // 2️⃣ Vérifier le code OTP
      if (sms_code !== otp) {
        const newAttempts = attempts + 1;

        // Si 3ème tentative : bloquer 15 min
        if (newAttempts >= 3) {
          await redis.setex(`blocked:login:${login_token}`, 900, '1'); // 15 min
          await redis.del(`login:${login_token}`);

          return res.status(429).json({
            success: false,
            message: 'Trop de tentatives. Réessayez dans 15 minutes.',
            code: 'BLOCKED_TEMPORARILY'
          });
        }

        // Sinon : incrémenter et retourner l'erreur
        await redis.setex(
          `login:${login_token}`,
          300,
          JSON.stringify({ ...session, attempts: newAttempts })
        );

        return res.status(400).json({
          success: false,
          message: 'Code SMS incorrect.',
          code: 'INVALID_SMS_CODE',
          data: {
            attempts_remaining: 3 - newAttempts
          }
        });
      }

      // 3️⃣ Code correct : supprimer la session, retourner les tokens
      await redis.del(`login:${login_token}`);

      // Récupérer l'utilisateur pour la réponse
      const user = await prisma.utilisateur.findUnique({
        where: { id_utilisateur: user_id },
        include: { utilisateur_role: { where: { actif: true } } }
      });

      // Use synchronized local roles (which were synced from Keycloak)
      const roles = (user.utilisateur_role || []).map((ur) => ur.role);
      const userLocalRole = roles.length > 0 ? roles[0] : 'passager';

      // Check if user's role is mobile-only
      const mobileOnlyRoles = ['passager', 'chauffeur', 'proprietaire'];
      if (mobileOnlyRoles.includes(userLocalRole)) {
        return res.status(403).json({
          success: false,
          message: 'Accès web non disponible pour ce rôle. Utilisez l\'application mobile.',
          code: 'MOBILE_ONLY_ROLE',
          data: null
        });
      }

      res.json({
        success: true,
        message: 'SMS vérifié.',
        data: {
          access_token,
          refresh_token,
          expires_in,
          token_type,
          user: {
            id_utilisateur: user.id_utilisateur,
            keycloak_id: user.keycloak_id,
            email: user.email,
            nom: user.nom,
            prenom: user.prenom,
            numero_telephone: user.numero_telephone,
            photo_profil: user.photo_profil,
            roles: roles.length > 0 ? roles : ['passager'],
            auth_provider: 'keycloak'
          }
        }
      });
    } catch (error) {
      console.error('❌ Verify SMS error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification du code.',
        code: 'VERIFY_ERROR'
      });
    }
  },

  /**
   * POST /auth/resend-sms
   * Renvoie le code OTP (avec cooldown 60s)
   */
  async resendSms(req, res) {
    try {
      const { login_token } = req.body;

      if (!login_token) {
        return res.status(400).json({
          success: false,
          message: 'login_token requis.',
          code: 'MISSING_FIELDS'
        });
      }

      // 1️⃣ Vérifier le cooldown (60s)
      const cooldownKey = `cooldown:login:${login_token}`;
      const onCooldown = await redis.exists(cooldownKey);

      if (onCooldown) {
        const ttl = await redis.ttl(cooldownKey);
        return res.status(429).json({
          success: false,
          message: `Attendez ${ttl} secondes avant de renvoyer.`,
          code: 'RESEND_COOLDOWN',
          data: {
            retry_after: ttl
          }
        });
      }

      // 2️⃣ Lire la session 2FA
      const sessionData = await redis.get(`login:${login_token}`);

      if (!sessionData) {
        return res.status(400).json({
          success: false,
          message: 'Session SMS expirée.',
          code: 'SESSION_EXPIRED'
        });
      }

      const session = JSON.parse(sessionData);
      const { otp, phone } = session;

      // 3️⃣ Renvoyer le SMS et mettre en place le cooldown
      await smsService.send(phone, otp);
      await redis.setex(cooldownKey, 60, '1'); // Cooldown 60s

      res.json({
        success: true,
        message: 'Nouveau code SMS envoyé.'
      });
    } catch (error) {
      console.error('❌ Resend SMS error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Erreur lors du renvoi du code.',
        code: 'RESEND_ERROR'
      });
    }
  },

  /**
   * POST /auth/forgot-password
   * Demande de reinitialisation de mot de passe
   */
  async forgotPassword(req, res) {
    const normalizedEmail = normalizeEmail(req.body?.email);
    const emailHash = sha256(normalizedEmail || 'missing');
    const ip = getClientIp(req);
    const genericResponse = {
      success: true,
      message: 'Si cette adresse existe, un email a ete envoye.'
    };

    if (!normalizedEmail) {
      logStructured('warn', {
        event: 'forgot_password_missing_email',
        email_hash: emailHash,
        ip
      });
      return res.status(200).json(genericResponse);
    }

    let localUser;
    try {
      localUser = await prisma.utilisateur.findUnique({
        where: { email: normalizedEmail },
        select: {
          id_utilisateur: true,
          email: true,
          prenom: true,
          keycloak_id: true,
          statut_compte: true
        }
      });
    } catch (error) {
      logStructured('error', {
        event: 'forgot_password_db_lookup_failed',
        email_hash: emailHash,
        ip,
        error: error.message
      });
      return res.status(200).json(genericResponse);
    }

    if (!localUser) {
      try {
        const keycloakUsers = await keycloakService.adminAPI.users.find({
          realm: process.env.KEYCLOAK_REALM,
          email: normalizedEmail,
          exact: true
        });

        if (Array.isArray(keycloakUsers) && keycloakUsers.length > 0) {
          logStructured('error', {
            event: 'forgot_password_desync_keycloak_without_pg',
            keycloak_id: keycloakUsers[0].id,
            email_hash: emailHash,
            ip
          });
        } else {
          logStructured('log', {
            event: 'forgot_password_unknown_email',
            email_hash: emailHash,
            ip
          });
        }
      } catch (error) {
        logStructured('error', {
          event: 'forgot_password_keycloak_lookup_unknown_email_failed',
          email_hash: emailHash,
          ip,
          error: error.message
        });
      }

      return res.status(200).json(genericResponse);
    }

    if (localUser.statut_compte !== 'actif') {
      logStructured('log', {
        event: 'forgot_password_blocked_account',
        id_utilisateur: localUser.id_utilisateur,
        statut_compte: localUser.statut_compte,
        email_hash: emailHash,
        ip
      });
      return res.status(200).json(genericResponse);
    }

    if (!localUser.keycloak_id) {
      logStructured('error', {
        event: 'forgot_password_desync_missing_keycloak_id',
        id_utilisateur: localUser.id_utilisateur,
        email_hash: emailHash,
        ip
      });
      return res.status(200).json(genericResponse);
    }

    let keycloakUser;
    try {
      keycloakUser = await keycloakService.adminAPI.users.findOne({
        realm: process.env.KEYCLOAK_REALM,
        id: localUser.keycloak_id
      });
    } catch (error) {
      logStructured('error', {
        event: 'forgot_password_keycloak_lookup_failed',
        id_utilisateur: localUser.id_utilisateur,
        keycloak_id: localUser.keycloak_id,
        email_hash: emailHash,
        ip,
        error: error.message
      });
      return res.status(200).json(genericResponse);
    }

    if (!keycloakUser) {
      logStructured('error', {
        event: 'forgot_password_desync_keycloak_user_not_found',
        id_utilisateur: localUser.id_utilisateur,
        keycloak_id: localUser.keycloak_id,
        email_hash: emailHash,
        ip
      });
      return res.status(200).json(genericResponse);
    }

    const rawToken = crypto.randomUUID();
    const tokenHash = sha256(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000);

    try {
      await prisma.password_reset_token.deleteMany({
        where: {
          id_utilisateur: localUser.id_utilisateur,
          used_at: null
        }
      });

      await prisma.password_reset_token.create({
        data: {
          token_hash: tokenHash,
          id_utilisateur: localUser.id_utilisateur,
          keycloak_id: localUser.keycloak_id,
          expires_at: expiresAt,
          created_ip: ip
        }
      });
    } catch (error) {
      logStructured('error', {
        event: 'forgot_password_token_persist_failed',
        id_utilisateur: localUser.id_utilisateur,
        keycloak_id: localUser.keycloak_id,
        email_hash: emailHash,
        ip,
        error: error.message
      });
      return res.status(200).json(genericResponse);
    }

    const frontendBaseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
    const resetLink = frontendBaseUrl.replace(/\/$/, '') + '/auth/reset-password?token=' + rawToken;

    try {
      await EmailService.sendPasswordResetEmail(localUser.email, {
        prenom: localUser.prenom || 'Utilisateur',
        resetLink,
        expiresInMinutes: PASSWORD_RESET_TOKEN_TTL_MINUTES,
        ipAddress: ip
      });

      logStructured('log', {
        event: 'forgot_password_email_sent',
        id_utilisateur: localUser.id_utilisateur,
        keycloak_id: localUser.keycloak_id,
        email_hash: emailHash,
        ip
      });
    } catch (error) {
      logStructured('error', {
        event: 'forgot_password_email_send_failed',
        id_utilisateur: localUser.id_utilisateur,
        keycloak_id: localUser.keycloak_id,
        email_hash: emailHash,
        ip,
        error: error.message
      });

      try {
        await prisma.password_reset_token.delete({
          where: {
            token_hash: tokenHash
          }
        });
      } catch (cleanupError) {
        logStructured('error', {
          event: 'forgot_password_token_cleanup_failed',
          id_utilisateur: localUser.id_utilisateur,
          email_hash: emailHash,
          ip,
          error: cleanupError.message
        });
      }
    }

    return res.status(200).json(genericResponse);
  },

  /**
   * POST /auth/reset-password
   * Applique la reinitialisation de mot de passe
   */
  async resetPassword(req, res) {
    const token = (req.body?.token || '').trim();
    const newPassword = req.body?.newPassword;
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    const now = new Date();

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token et nouveau mot de passe requis.',
        code: 'MISSING_FIELDS'
      });
    }

    const passwordStrength = validatePasswordStrength(newPassword);
    if (!passwordStrength.isValid) {
      logStructured('warn', {
        event: 'reset_password_weak_password',
        ip,
        violations: passwordStrength.violations
      });

      return res.status(400).json({
        success: false,
        message: 'Le mot de passe ne respecte pas la politique de securite.',
        code: 'WEAK_PASSWORD',
        errors: { violations: passwordStrength.violations }
      });
    }

    const tokenHash = sha256(token);

    let resetToken;
    try {
      resetToken = await prisma.password_reset_token.findUnique({
        where: { token_hash: tokenHash },
        include: {
          utilisateur: {
            select: {
              id_utilisateur: true,
              email: true,
              prenom: true,
              keycloak_id: true
            }
          }
        }
      });
    } catch (error) {
      logStructured('error', {
        event: 'reset_password_token_lookup_failed',
        ip,
        error: error.message
      });
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la reinitialisation.',
        code: 'RESET_PASSWORD_LOOKUP_FAILED'
      });
    }

    if (!resetToken) {
      logStructured('warn', {
        event: 'reset_password_invalid_token',
        ip
      });
      return res.status(400).json({
        success: false,
        message: 'Lien invalide ou expire. Faites une nouvelle demande.',
        code: 'INVALID_RESET_TOKEN'
      });
    }

    if (resetToken.used_at) {
      logStructured('warn', {
        event: 'reset_password_token_already_used',
        id_reset_token: resetToken.id,
        id_utilisateur: resetToken.id_utilisateur,
        ip
      });
      return res.status(400).json({
        success: false,
        message: 'Ce lien a deja ete utilise. Faites une nouvelle demande.',
        code: 'USED_RESET_TOKEN'
      });
    }

    if (resetToken.expires_at <= now) {
      try {
        await prisma.password_reset_token.delete({
          where: { id: resetToken.id }
        });
      } catch (error) {
        logStructured('error', {
          event: 'reset_password_expired_token_delete_failed',
          id_reset_token: resetToken.id,
          ip,
          error: error.message
        });
      }

      logStructured('warn', {
        event: 'reset_password_expired_token',
        id_reset_token: resetToken.id,
        id_utilisateur: resetToken.id_utilisateur,
        ip
      });
      return res.status(400).json({
        success: false,
        message: 'Lien invalide ou expire. Faites une nouvelle demande.',
        code: 'EXPIRED_RESET_TOKEN'
      });
    }

    if (!resetToken.utilisateur) {
      logStructured('error', {
        event: 'reset_password_missing_local_user',
        id_reset_token: resetToken.id,
        id_utilisateur: resetToken.id_utilisateur,
        keycloak_id: resetToken.keycloak_id,
        ip
      });
      return res.status(400).json({
        success: false,
        message: 'Lien invalide ou expire. Faites une nouvelle demande.',
        code: 'INVALID_RESET_TOKEN'
      });
    }

    const localUser = resetToken.utilisateur;

    if (!localUser.keycloak_id) {
      logStructured('error', {
        event: 'reset_password_desync_missing_keycloak_id',
        id_reset_token: resetToken.id,
        id_utilisateur: localUser.id_utilisateur,
        ip
      });
      return res.status(400).json({
        success: false,
        message: 'Lien invalide ou expire. Faites une nouvelle demande.',
        code: 'INVALID_RESET_TOKEN'
      });
    }

    let keycloakUser;
    try {
      keycloakUser = await keycloakService.adminAPI.users.findOne({
        realm: process.env.KEYCLOAK_REALM,
        id: resetToken.keycloak_id
      });
    } catch (error) {
      logStructured('error', {
        event: 'reset_password_keycloak_lookup_failed',
        id_reset_token: resetToken.id,
        id_utilisateur: localUser.id_utilisateur,
        keycloak_id: resetToken.keycloak_id,
        ip,
        error: error.message
      });
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la reinitialisation.',
        code: 'RESET_PASSWORD_KEYCLOAK_LOOKUP_FAILED'
      });
    }

    if (!keycloakUser) {
      logStructured('error', {
        event: 'reset_password_desync_keycloak_user_not_found',
        id_reset_token: resetToken.id,
        id_utilisateur: localUser.id_utilisateur,
        keycloak_id: resetToken.keycloak_id,
        ip
      });
      return res.status(400).json({
        success: false,
        message: 'Lien invalide ou expire. Faites une nouvelle demande.',
        code: 'INVALID_RESET_TOKEN'
      });
    }

    try {
      await keycloakService.adminAPI.users.resetPassword({
        realm: process.env.KEYCLOAK_REALM,
        id: resetToken.keycloak_id,
        credential: {
          type: 'password',
          value: newPassword,
          temporary: false
        }
      });
    } catch (error) {
      logStructured('error', {
        event: 'reset_password_keycloak_update_failed',
        id_reset_token: resetToken.id,
        id_utilisateur: localUser.id_utilisateur,
        keycloak_id: resetToken.keycloak_id,
        ip,
        error: error.message
      });
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la reinitialisation.',
        code: 'RESET_PASSWORD_KEYCLOAK_UPDATE_FAILED'
      });
    }

    try {
      await prisma.password_reset_token.update({
        where: { id: resetToken.id },
        data: {
          used_at: now,
          used_ip: ip
        }
      });
    } catch (error) {
      logStructured('error', {
        event: 'reset_password_mark_token_used_failed',
        id_reset_token: resetToken.id,
        id_utilisateur: localUser.id_utilisateur,
        ip,
        error: error.message
      });

      try {
        await prisma.password_reset_token.delete({
          where: { id: resetToken.id }
        });
      } catch (cleanupError) {
        logStructured('error', {
          event: 'reset_password_token_delete_after_update_failure_failed',
          id_reset_token: resetToken.id,
          id_utilisateur: localUser.id_utilisateur,
          ip,
          error: cleanupError.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la reinitialisation.',
        code: 'RESET_PASSWORD_TOKEN_UPDATE_FAILED'
      });
    }

    try {
      await EmailService.sendPasswordChangedNotification(localUser.email, {
        prenom: localUser.prenom || 'Utilisateur',
        changedAt: now,
        ipAddress: ip,
        userAgent
      });
    } catch (error) {
      logStructured('error', {
        event: 'reset_password_notification_email_failed',
        id_utilisateur: localUser.id_utilisateur,
        keycloak_id: localUser.keycloak_id,
        ip,
        error: error.message
      });
    }

    logStructured('log', {
      event: 'reset_password_success',
      id_reset_token: resetToken.id,
      id_utilisateur: localUser.id_utilisateur,
      keycloak_id: localUser.keycloak_id,
      ip
    });

    return res.json({
      success: true,
      message: 'Mot de passe reinitialise avec succes. Vous pouvez vous connecter.'
    });
  },

  /**
   * POST /auth/admin/users
   * Création d'utilisateur par un administrateur
   */
  async createUserByAdmin(req, res) {
    try {
      const { nom, prenom, email, mot_de_passe, role, numero_telephone, adresse, parking_id } = req.body;

      // Vérifications d'unicité
      const existingEmail = await prisma.utilisateur.findUnique({ where: { email } });
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'Un compte avec cet email existe déjà.',
          errors: { field: 'email', code: 'DUPLICATE_EMAIL' }
        });
      }

      const existingPhone = await prisma.utilisateur.findUnique({ where: { numero_telephone } });
      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message: 'Ce numéro de téléphone est déjà utilisé.',
          errors: { field: 'numero_telephone', code: 'DUPLICATE_PHONE' }
        });
      }

      const mot_de_passe_hash = await bcrypt.hash(mot_de_passe, 12);

      const newUser = await prisma.$transaction(async (tx) => {
        const user = await tx.utilisateur.create({
          data: {
            nom,
            prenom,
            email,
            mot_de_passe_hash,
            numero_telephone,
            adresse,
            auth_provider: 'keycloak',
            utilisateur_role: {
              create: { role, actif: true }
            }
          }
        });

        if (role === 'passager') {
          await tx.passager.create({ data: { id_passager: user.id_utilisateur } });
        }
        if (role === 'chauffeur') {
          await tx.chauffeur.create({
            data: {
              id_chauffeur: user.id_utilisateur,
              type_service: 'vtc',
              statut_validation: 'valide'
            }
          });
        }
        if (role === 'proprietaire') {
          await tx.proprietaire.create({ data: { id_proprietaire: user.id_utilisateur } });
        }
        if (role === 'gestionnaire') {
          if (!parking_id) {
            throw new Error('Un parking doit être associé au gestionnaire.');
          }
          await tx.gestionnaire_parking.create({
            data: {
              id_gestionnaire: user.id_utilisateur,
              id_parking: parking_id
            }
          });
        }

        await tx.portefeuille.create({
          data: { id_utilisateur: user.id_utilisateur }
        });

        return user;
      });

      const createdUser = await prisma.utilisateur.findUnique({
        where: { id_utilisateur: newUser.id_utilisateur },
        include: {
          utilisateur_role: { where: { actif: true } },
          gestionnaire: true
        }
      });

      const formattedUser = {
        id_utilisateur: createdUser.id_utilisateur,
        nom: createdUser.nom,
        prenom: createdUser.prenom,
        email: createdUser.email,
        numero_telephone: createdUser.numero_telephone,
        adresse: createdUser.adresse,
        statut_compte: createdUser.statut_compte,
        date_inscription: createdUser.date_inscription,
        photo_profil: createdUser.photo_profil,
        note_moyenne: createdUser.note_moyenne,
        role: createdUser.utilisateur_role.map(r => r.role),
        parking_id: createdUser.gestionnaire?.id_parking || null
      };

      res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès.',
        data: formattedUser,
        errors: null
      });
    } catch (error) {
      console.error('❌ Create user error:', error.message);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur serveur lors de la création.',
        errors: error.message
      });
    }
  },

  /**
   * POST /auth/otp/request
   * Request OTP code for phone-based authentication
   * Body: { phone }
   * Rate limited: 1 per 60s per phone, max 5 per 24h
   */
  async otpRequest(req, res) {
    try {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Numéro de téléphone requis.',
          code: 'MISSING_PHONE'
        });
      }

      // Normalize and validate phone
      let normalizedPhone;
      try {
        normalizedPhone = phoneService.normalize(phone);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
          code: 'INVALID_PHONE'
        });
      }

      // Check if phone is blocked
      const isBlocked = await otpService.isPhoneBlocked(normalizedPhone);
      if (isBlocked) {
        return res.status(429).json({
          success: false,
          message: 'Trop de tentatives. Réessayez dans 15 minutes.',
          code: 'OTP_BLOCKED'
        });
      }

      // Generate OTP and store in Redis
      const otpCode = otpService.generateOtp();
      await otpService.storeOtp(normalizedPhone, otpCode);

      // Send SMS
      try {
        await smsService.send(normalizedPhone, otpCode);
      } catch (smsError) {
        console.error('❌ SMS send error:', smsError.message);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de l\'envoi du SMS.',
          code: 'SMS_ERROR'
        });
      }

      // Log authentication attempt
      try {
        await prisma.auth_log.create({
          data: {
            event_type: 'otp_request',
            channel: 'sms',
            ip_address: req.ip,
            metadata: { phone: normalizedPhone, status: 'success' }
          }
        });
      } catch (logError) {
        console.warn('⚠️ Could not log OTP request:', logError.message);
      }

      res.json({
        success: true,
        message: 'Code OTP envoyé par SMS.',
        data: {
          phone_masked: phoneService.mask(normalizedPhone)
        }
      });
    } catch (error) {
      console.error('❌ OTP request error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la demande de code OTP.',
        code: 'OTP_REQUEST_ERROR'
      });
    }
  },

  /**
   * POST /auth/otp/verify
   * Verify OTP and create/login user
   * Body: { phone, otp_code }
   * Complex flow: OTP validation → User search/creation in Keycloak → Token generation
   */
  async otpVerify(req, res) {
    try {
      const { phone, otp_code } = req.body;

      if (!phone || !otp_code) {
        return res.status(400).json({
          success: false,
          message: 'Téléphone et code OTP requis.',
          code: 'MISSING_FIELDS'
        });
      }

      // Normalize phone
      let normalizedPhone;
      try {
        normalizedPhone = phoneService.normalize(phone);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
          code: 'INVALID_PHONE'
        });
      }

      // Verify OTP code
      try {
        await otpService.verifyOtp(normalizedPhone, otp_code);
      } catch (otpError) {
        if (otpError.code === 'OTP_BLOCKED') {
          return res.status(429).json({
            success: false,
            message: 'Trop de tentatives. Réessayez dans 15 minutes.',
            code: 'OTP_BLOCKED'
          });
        }

        if (otpError.code === 'OTP_EXPIRED') {
          return res.status(400).json({
            success: false,
            message: 'Code OTP expiré ou invalide.',
            code: 'OTP_EXPIRED'
          });
        }

        return res.status(400).json({
          success: false,
          message: 'Code OTP incorrect.',
          code: 'INVALID_OTP',
          data: {
            attempts_remaining: otpError.attemptsRemaining
          }
        });
      }

      // Search user in Keycloak by username (phone)
      let keycloakUser = null;
      let localUser = null;
      let techPassword;

      try {
        keycloakUser = await keycloakService.findUserByUsername(normalizedPhone);
      } catch (error) {
        console.warn('⚠️ Could not search Keycloak user:', error.message);
      }

      // If user not found, create in Keycloak + local DB
      if (!keycloakUser) {
        try {
          // Generate random technical password
          techPassword = generateTechPassword();

          // Create user in Keycloak
          keycloakUser = await keycloakService.adminAPI.users.create({
            realm: process.env.KEYCLOAK_REALM,
            username: normalizedPhone,
            attributes: {
              phone: normalizedPhone
            },
            credentials: [
              {
                type: 'password',
                value: techPassword,
                temporary: false
              }
            ],
            enabled: true
          });

          // Assign passager role (realm role, not client role)
          const passagerRole = await keycloakService.adminAPI.roles.findOneByName({
            realm: process.env.KEYCLOAK_REALM,
            name: 'ndjigi-passager'
          });

          if (passagerRole) {
            await keycloakService.adminAPI.users.addRealmRoleMappings({
              realm: process.env.KEYCLOAK_REALM,
              id: keycloakUser.id,
              roles: [passagerRole]
            });
            logger.info({
              event: 'keycloak_role_assigned',
              email: normalizedPhone,
              keycloak_id: keycloakUser.id,
              role: 'ndjigi-passager'
            });
          }

          // Create local user
          const encryptedPassword = encrypt(techPassword);

          localUser = await prisma.utilisateur.create({
            data: {
              keycloak_id: keycloakUser.id,
              numero_telephone: normalizedPhone,
              email: null,
              prenom: null,
              nom: null,
              auth_provider: 'keycloak',
              auth_method_otp: true,
              tech_password_encrypted: encryptedPassword,
              utilisateur_role: {
                create: {
                  role: 'passager',
                  actif: true
                }
              }
            },
            include: {
              utilisateur_role: { where: { actif: true } }
            }
          });

          console.log(`✅ Created new user via OTP: ${normalizedPhone}`);
        } catch (createError) {
          console.error('❌ Error creating Keycloak user:', createError.message);
          return res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du compte.',
            code: 'USER_CREATION_ERROR'
          });
        }
      } else {
        // User exists: retrieve and decrypt tech password
        try {
          localUser = await prisma.utilisateur.findUnique({
            where: { keycloak_id: keycloakUser.id },
            include: {
              utilisateur_role: { where: { actif: true } }
            }
          });

          if (!localUser?.tech_password_encrypted) {
            return res.status(500).json({
              success: false,
              message: 'Mot de passe technique non trouvé.',
              code: 'MISSING_TECH_PASSWORD'
            });
          }

          techPassword = decrypt(localUser.tech_password_encrypted);
        } catch (decryptError) {
          console.error('❌ Error decrypting tech password:', decryptError.message);
          return res.status(500).json({
            success: false,
            message: 'Erreur lors du déchiffrement du mot de passe.',
            code: 'DECRYPTION_ERROR'
          });
        }
      }

      // Exchange technical password for Keycloak tokens
      let kcTokens;
      try {
        kcTokens = await keycloakService.login(normalizedPhone, techPassword);
      } catch (loginError) {
        console.error('❌ Keycloak login error:', loginError.message);
        return res.status(401).json({
          success: false,
          message: 'Erreur lors de l\'authentification.',
          code: 'KEYCLOAK_LOGIN_ERROR'
        });
      }

      // [PHASE 6] Check if user has TOTP configured
      let hasTotp = false;
      try {
        // Fetch user from Keycloak to check credentials
        const kcUser = await keycloakService.adminAPI.users.findOne({
          realm: process.env.KEYCLOAK_REALM,
          id: keycloakUser.id
        });

        // Check if credentials contain type: 'otp'
        hasTotp = kcUser.credentials?.some(c => c.type === 'otp') || false;
      } catch (totpCheckError) {
        console.warn('⚠️ Could not check TOTP status:', totpCheckError.message);
        // Continue without TOTP check if error
      }

      const roles = (localUser?.utilisateur_role || []).map(ur => ur.role);

      // Log successful authentication
      try {
        await prisma.auth_log.create({
          data: {
            phone: normalizedPhone,
            action: 'otp_verify',
            status: 'success',
            ip_address: req.ip
          }
        });
      } catch (logError) {
        console.warn('⚠️ Could not log OTP verification:', logError.message);
      }

      // [PHASE 6] Handle TOTP requirement
      if (!hasTotp) {
        // User doesn't have TOTP: generate secret and return setup response
        const loginToken = uuidv4();
        const { secret, qr_code_url } = totpService.generateSecret(localUser.email || normalizedPhone);

        // Store tokens + TOTP secret in Redis for 5 minutes
        await redis.setex(
          `login:${loginToken}`,
          300,
          JSON.stringify({
            access_token: kcTokens.access_token,
            refresh_token: kcTokens.refresh_token,
            expires_in: kcTokens.expires_in,
            token_type: kcTokens.token_type,
            totp_secret: secret,
            keycloak_id: keycloakUser.id,
            user_id: localUser.id_utilisateur,
            setup_mode: true,
            created_at: Math.floor(Date.now() / 1000)
          })
        );

        return res.json({
          success: true,
          message: 'Configuration du 2FA requise.',
          data: {
            requires_totp_setup: true,
            login_token: loginToken,
            totp_secret: secret,
            qr_code_url: qr_code_url
          }
        });
      } else {
        // User has TOTP configured: store tokens for verification
        const loginToken = uuidv4();

        await redis.setex(
          `login:${loginToken}`,
          300,
          JSON.stringify({
            access_token: kcTokens.access_token,
            refresh_token: kcTokens.refresh_token,
            expires_in: kcTokens.expires_in,
            token_type: kcTokens.token_type,
            keycloak_id: keycloakUser.id,
            user_id: localUser.id_utilisateur,
            attempts: 0,
            setup_mode: false,
            created_at: Math.floor(Date.now() / 1000)
          })
        );

        return res.json({
          success: true,
          message: 'Vérification du 2FA requise.',
          data: {
            requires_totp: true,
            login_token: loginToken
          }
        });
      }

      // This line should not be reached (responses above return), but keeping for clarity
      res.json({
        success: true,
        message: 'Authentification réussie.',
        data: {
          access_token: kcTokens.access_token,
          refresh_token: kcTokens.refresh_token,
          expires_in: kcTokens.expires_in,
          token_type: kcTokens.token_type,
          user: {
            id_utilisateur: localUser.id_utilisateur,
            keycloak_id: keycloakUser.id,
            numero_telephone: normalizedPhone,
            email: localUser.email,
            prenom: localUser.prenom,
            nom: localUser.nom,
            photo_profil: localUser.photo_profil,
            roles: roles.length > 0 ? roles : ['passager'],
            auth_provider: 'keycloak',
            auth_method_otp: true
          }
        }
      });
    } catch (error) {
      console.error('❌ OTP verify error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification du code.',
        code: 'OTP_VERIFY_ERROR'
      });
    }
  },

  /**
   * POST /auth/otp/resend
   * Resend OTP code (60-second cooldown)
   * Body: { phone }
   */
  async otpResend(req, res) {
    try {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Numéro de téléphone requis.',
          code: 'MISSING_PHONE'
        });
      }

      // Normalize phone
      let normalizedPhone;
      try {
        normalizedPhone = phoneService.normalize(phone);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
          code: 'INVALID_PHONE'
        });
      }

      // Check cooldown
      try {
        await otpService.resendOtp(normalizedPhone);
      } catch (cooldownError) {
        if (cooldownError.code === 'RESEND_COOLDOWN') {
          return res.status(429).json({
            success: false,
            message: `Attendez ${cooldownError.retryAfter} secondes avant de renvoyer.`,
            code: 'RESEND_COOLDOWN',
            data: {
              retry_after: cooldownError.retryAfter
            }
          });
        }
        throw cooldownError;
      }

      // Generate new OTP
      const otpCode = otpService.generateOtp();
      await otpService.storeOtp(normalizedPhone, otpCode);

      // Send SMS
      try {
        await smsService.send(normalizedPhone, otpCode);
      } catch (smsError) {
        console.error('❌ SMS send error:', smsError.message);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de l\'envoi du SMS.',
          code: 'SMS_ERROR'
        });
      }

      res.json({
        success: true,
        message: 'Nouveau code OTP envoyé.'
      });
    } catch (error) {
      console.error('❌ OTP resend error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du renvoi du code.',
        code: 'OTP_RESEND_ERROR'
      });
    }
  },

  /**
   * POST /auth/totp/setup
   * Setup TOTP 2FA after OTP verification
   * Body: { login_token, totp_code }
   * Validates TOTP code and registers credential in Keycloak
   */
  async totpSetup(req, res) {
    try {
      const { login_token, totp_code } = req.body;

      if (!login_token || !totp_code) {
        return res.status(400).json({
          success: false,
          message: 'login_token et code TOTP requis.',
          code: 'MISSING_FIELDS'
        });
      }

      // Get session from Redis
      const sessionData = await redis.get(`login:${login_token}`);
      if (!sessionData) {
        return res.status(400).json({
          success: false,
          message: 'Session expirée.',
          code: 'SESSION_EXPIRED'
        });
      }

      const session = JSON.parse(sessionData);

      // Verify TOTP code against stored secret
      const isValid = totpService.verify(session.totp_secret, totp_code);

      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Code TOTP incorrect.',
          code: 'INVALID_TOTP'
        });
      }

      // Register TOTP credential in Keycloak via Admin API
      try {
        // Get user object first
        const user = await keycloakService.adminAPI.users.findOne({
          realm: process.env.KEYCLOAK_REALM,
          id: session.keycloak_id
        });

        // Push OTP credential
        const updatedCredentials = [
          ...(user.credentials || []),
          {
            type: 'otp',
            userLabel: 'Google Authenticator',
            credentialData: JSON.stringify({
              subType: 'totp',
              counter: 0
            }),
            secretData: JSON.stringify({
              value: session.totp_secret
            })
          }
        ];

        // Update user with TOTP credential
        await keycloakService.adminAPI.users.update(
          { realm: process.env.KEYCLOAK_REALM, id: session.keycloak_id },
          { credentials: updatedCredentials }
        );

        console.log(`✅ TOTP registered for user: ${session.keycloak_id}`);
      } catch (totpRegisterError) {
        console.error('❌ Error registering TOTP in Keycloak:', totpRegisterError.message);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de l\'enregistrement du 2FA.',
          code: 'TOTP_REGISTER_ERROR'
        });
      }

      // Delete session and return tokens
      await redis.del(`login:${login_token}`);

      res.json({
        success: true,
        message: 'TOTP configuré.',
        data: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: session.expires_in,
          token_type: session.token_type,
          user: {
            id_utilisateur: session.user_id,
            keycloak_id: session.keycloak_id,
            auth_provider: 'keycloak',
            auth_method_otp: true
          }
        }
      });
    } catch (error) {
      console.error('❌ TOTP setup error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la configuration du TOTP.',
        code: 'TOTP_SETUP_ERROR'
      });
    }
  },

  /**
   * POST /auth/totp/verify
   * Verify TOTP code for users with 2FA enabled
   * Body: { login_token, totp_code }
   * Validates TOTP and returns tokens
   */
  async totpVerify(req, res) {
    try {
      const { login_token, totp_code } = req.body;

      if (!login_token || !totp_code) {
        return res.status(400).json({
          success: false,
          message: 'login_token et code TOTP requis.',
          code: 'MISSING_FIELDS'
        });
      }

      // Get session from Redis
      const sessionData = await redis.get(`login:${login_token}`);
      if (!sessionData) {
        return res.status(400).json({
          success: false,
          message: 'Session expirée.',
          code: 'SESSION_EXPIRED'
        });
      }

      const session = JSON.parse(sessionData);
      const attempts = session.attempts || 0;

      // Fetch user from Keycloak to get TOTP secret
      let totpSecret;
      try {
        const user = await keycloakService.adminAPI.users.findOne({
          realm: process.env.KEYCLOAK_REALM,
          id: session.keycloak_id
        });

        const totpCredential = user.credentials?.find(c => c.type === 'otp');
        if (!totpCredential) {
          return res.status(500).json({
            success: false,
            message: 'TOTP non configuré.',
            code: 'TOTP_NOT_CONFIGURED'
          });
        }

        // Extract secret from credential
        try {
          const secretData = JSON.parse(totpCredential.secretData);
          totpSecret = secretData.value;
        } catch (parseError) {
          console.error('❌ Error parsing TOTP secret:', parseError.message);
          return res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du TOTP.',
            code: 'TOTP_PARSE_ERROR'
          });
        }
      } catch (fetchError) {
        console.error('❌ Error fetching user for TOTP:', fetchError.message);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la vérification du TOTP.',
          code: 'TOTP_FETCH_ERROR'
        });
      }

      // Validate TOTP code
      const isValid = totpService.verify(totpSecret, totp_code);

      if (!isValid) {
        const newAttempts = attempts + 1;

        if (newAttempts >= 3) {
          // Block after 3 failures
          await redis.del(`login:${login_token}`);

          return res.status(401).json({
            success: false,
            message: 'Trop de tentatives.',
            code: 'TOTP_BLOCKED'
          });
        }

        // Update attempts in Redis
        await redis.setex(
          `login:${login_token}`,
          300,
          JSON.stringify({ ...session, attempts: newAttempts })
        );

        return res.status(401).json({
          success: false,
          message: 'Code TOTP incorrect.',
          code: 'INVALID_TOTP',
          data: {
            attempts_remaining: 3 - newAttempts
          }
        });
      }

      // Valid code: return tokens
      await redis.del(`login:${login_token}`);

      res.json({
        success: true,
        message: 'TOTP vérifié.',
        data: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: session.expires_in,
          token_type: session.token_type,
          user: {
            id_utilisateur: session.user_id,
            keycloak_id: session.keycloak_id,
            auth_provider: 'keycloak',
            auth_method_otp: true
          }
        }
      });
    } catch (error) {
      console.error('❌ TOTP verify error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification du TOTP.',
        code: 'TOTP_VERIFY_ERROR'
      });
    }
  },

  // ──── Phase 7: Password Reset & Admin Gestionnaire Management ────

  /**
   * Create gestionnaire account
   * POST /api/v1/admin/gestionnaires
   * Body: { email, nom, prenom, phone, parkings_assignes: string[] }
   * Requires: ndjigi-admin role
   */
  async createGestionnaire(req, res) {
    try {
      const { email, nom, prenom, phone, parkings_assignes } = req.body;

      // Validate input
      if (!email || !nom || !prenom || !phone || !Array.isArray(parkings_assignes)) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: email, nom, prenom, phone, parkings_assignes',
          code: 'VALIDATION_ERROR'
        });
      }

      if (parkings_assignes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one parking must be assigned',
          code: 'NO_PARKINGS'
        });
      }

      // Generate temporary password (12 random chars)
      const tempPassword = require('crypto').randomBytes(6).toString('hex').substring(0, 12);

      // Create user in Keycloak
      const newUser = {
        username: email,
        email: email,
        emailVerified: false,
        firstName: prenom,
        lastName: nom,
        enabled: true,
        attributes: {
          phone: phone
        },
        requiredActions: ['UPDATE_PASSWORD', 'VERIFY_EMAIL'],
        credentials: [
          {
            type: 'password',
            value: tempPassword,
            temporary: true
          }
        ]
      };

      const keycloakUser = await keycloakService.adminAPI.users.create({
        realm: process.env.KEYCLOAK_REALM,
        body: newUser
      });

      const keycloak_id = keycloakUser.id;

      // Assign ndjigi-gestionnaire role
      const realm = await keycloakService.adminAPI.realms.findOne({
        realm: process.env.KEYCLOAK_REALM
      });

      const gestionnairerole = await keycloakService.adminAPI.roles.findOneByName({
        realm: process.env.KEYCLOAK_REALM,
        name: 'ndjigi-gestionnaire'
      });

      if (gestionnairerole) {
        await keycloakService.adminAPI.users.addRealmRoleMappings({
          realm: process.env.KEYCLOAK_REALM,
          id: keycloak_id,
          roles: [gestionnairerole]
        });
      }

      // Create user in local database
      const id_utilisateur = require('uuid').v4();

      const dbUser = await prisma.utilisateur.create({
        data: {
          id_utilisateur,
          keycloak_id,
          email,
          nom,
          prenom,
          numero_telephone: phone,
          phone,
          mot_de_passe_hash: '', // Not used for Keycloak users
          auth_provider: 'keycloak',
          statut_compte: 'actif'
        }
      });

      // Fetch parkings to assign
      const parkings = await prisma.parking.findMany({
        where: {
          id_parking: {
            in: parkings_assignes
          }
        }
      });

      if (parkings.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid parkings found',
          code: 'INVALID_PARKINGS'
        });
      }

      // Assign parkings via gestionnaire_parking
      await Promise.all(
        parkings.map(p =>
          prisma.gestionnaire_parking.upsert({
            where: {
              id_gestionnaire_id_parking: {
                id_gestionnaire: id_utilisateur,
                id_parking: p.id_parking
              }
            },
            update: {},
            create: {
              id_gestionnaire: id_utilisateur,
              id_parking: p.id_parking,
              date_prise_poste: new Date()
            }
          })
        )
      );

      // Send welcome email
      const emailService = require('../services/emailService');
      try {
        await emailService.sendGestionnaireWelcome(email, {
          prenom,
          nom,
          email,
          tempPassword,
          parkings: parkings.map(p => ({
            nom: p.nom,
            adresse: p.adresse
          }))
        });
      } catch (emailError) {
        console.error('⚠️ Failed to send welcome email:', emailError.message);
        // Don't fail the request if email fails
      }

      // Log auth event
      await prisma.auth_log.create({
        data: {
          user_id: id_utilisateur,
          event_type: 'GESTIONNAIRE_CREATED_BY_ADMIN',
          metadata: {
            parkings: parkings.map(p => p.nom)
          }
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Gestionnaire créé avec succès',
        data: {
          id_utilisateur,
          keycloak_id,
          email,
          nom,
          prenom,
          phone,
          parkings: parkings.map(p => ({
            id_parking: p.id_parking,
            nom: p.nom,
            adresse: p.adresse
          }))
        }
      });
    } catch (error) {
      console.error('❌ Create gestionnaire error:', error.message);

      // Clean up Keycloak user if DB creation failed
      if (error.response?.status === 201 && error.keycloak_id) {
        try {
          await keycloakService.adminAPI.users.del({
            realm: process.env.KEYCLOAK_REALM,
            id: error.keycloak_id
          });
        } catch (cleanupError) {
          console.error('⚠️ Cleanup error:', cleanupError.message);
        }
      }

      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du gestionnaire',
        code: 'CREATION_ERROR'
      });
    }
  }
};

module.exports = KeycloakAuthController;
