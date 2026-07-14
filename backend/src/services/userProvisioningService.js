/**
 * SERVICES/USERPROVISIONINGSERVICE.JS
 * Core service for atomic user creation across Keycloak + PostgreSQL
 *
 * Architecture:
 * 1. Create user in Keycloak (obtain keycloak_id)
 * 2. Create user in PostgreSQL with keycloak_id (atomic transaction)
 * 3. If PG fails → rollback Keycloak user
 * 4. If rollback fails → log CRITICAL for manual cleanup
 */

const crypto = require('crypto');
const { prisma } = require('../config/db');
const keycloakService = require('./keycloakService');
const EmailService = require('./emailService');
const ProvisioningError = require('../errors/ProvisioningError');
const { ROLE_MAPPING, getKeycloakRole } = require('../constants/roles');
const logger = require('../utils/logger');

/**
 * Generate a strong temporary password (12 chars: uppercase, lowercase, digit, special)
 * @returns {string} e.g., "Ax#9Kp@2Lm4"
 */
function generateTempPassword() {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*';

  const allChars = uppercase + lowercase + digits + special;

  // Ensure at least one of each type
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Normalize email (trim, lowercase)
 * @param {string} email
 * @returns {string}
 */
function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

/**
 * Create a user provisioning operation (Keycloak + PostgreSQL)
 *
 * @param {object} params
 * @param {string} params.email - User email (required)
 * @param {string} params.prenom - First name (required)
 * @param {string} params.nom - Last name (required)
 * @param {string} params.role - Local role name: 'admin'|'gestionnaire'|'chauffeur'|'passager'|'proprietaire' (required)
 * @param {string} [params.numero_telephone] - Phone number (optional)
 * @param {string} [params.adresse] - Address (optional)
 * @param {object} [params.metadata] - Role-specific metadata: { id_parking, type_service, ... } (optional)
 * @param {string} [params.tempPassword] - Explicit temp password instead of generating one (optional, for seed)
 * @param {boolean} [params.sendInvitationEmail=false] - Send welcome email (optional, defaults to false = fail-closed)
 * @param {object} [params.createdBy] - { id_utilisateur, role } for audit logging (optional)
 * @param {boolean} [params.systemUser=false] - System user (skip KC creation, set keycloak_id='SYSTEM_NO_AUTH') (optional)
 * @param {object} [params.prismaTx] - Prisma transaction handle (optional, for nested operations)
 *
 * @returns {Promise<{
 *   id_utilisateur: string,
 *   keycloak_id: string,
 *   email: string,
 *   prenom: string,
 *   nom: string,
 *   role: string,
 *   tempPassword?: string
 * }>}
 *
 * @throws {ProvisioningError} with code:
 *   - 'EMAIL_EXISTS': Email already exists in PG or KC
 *   - 'KEYCLOAK_ERROR': Keycloak user creation failed
 *   - 'PG_ERROR': PostgreSQL user creation failed
 *   - 'ROLLBACK_FAILED': Keycloak rollback failed (manual cleanup needed)
 */
async function create(params) {
  const {
    email: rawEmail,
    prenom,
    nom,
    role,
    numero_telephone,
    adresse,
    metadata = {},
    tempPassword = null,
    sendInvitationEmail = false,
    createdBy = {},
    systemUser = false,
    prismaTx = null,
  } = params;

  // Normalize inputs
  const email = normalizeEmail(rawEmail);

  // If no transaction handle provided, wrap entire operation in transaction
  if (prismaTx) {
    return createUserInternal({ email, prenom, nom, role, numero_telephone, adresse, metadata, tempPassword, sendInvitationEmail, createdBy, systemUser, tx: prismaTx });
  }

  return prisma.$transaction(async (tx) => {
    return createUserInternal({ email, prenom, nom, role, numero_telephone, adresse, metadata, tempPassword, sendInvitationEmail, createdBy, systemUser, tx });
  });
}

async function createUserInternal(params) {
  const {
    email,
    prenom,
    nom,
    role,
    numero_telephone,
    adresse,
    metadata = {},
    tempPassword = null,
    sendInvitationEmail = false,
    createdBy = {},
    systemUser = false,
    tx
  } = params;

  // ─── Step 1: Validate inputs ────────────────────────────────────
  logger.info({
    event: 'user_provisioning_start',
    email_normalized: email,
    role,
    system_user: systemUser,
  });

  if (!email || !prenom || !nom || !role) {
    throw new ProvisioningError(
      'VALIDATION_ERROR',
      'Missing required fields: email, prenom, nom, role',
      { email, prenom, nom, role }
    );
  }

  if (!Object.values(ROLE_MAPPING).includes(role)) {
    const validRoles = Object.values(ROLE_MAPPING).join(', ');
    throw new ProvisioningError(
      'INVALID_ROLE',
      `Invalid role "${role}". Valid roles: ${validRoles}`,
      { role, validRoles }
    );
  }

  // ─── Step 2: Early check — email doesn't exist in PG ────────────
  try {
    const existingPgUser = await tx.utilisateur.findUnique({ where: { email } });
    if (existingPgUser) {
      throw new ProvisioningError(
        'EMAIL_EXISTS',
        `User with email "${email}" already exists in PostgreSQL`,
        { email, existing_id: existingPgUser.id_utilisateur }
      );
    }
  } catch (err) {
    if (err instanceof ProvisioningError) throw err;
    throw new ProvisioningError(
      'PG_ERROR',
      `Database query failed during email check: ${err.message}`,
      { originalError: err.message }
    );
  }

  let keycloak_id = null;
  // Use provided tempPassword (for seed/testing) or generate a new one
  let password = tempPassword || generateTempPassword();

  // ─── Step 3: Create in Keycloak (unless systemUser) ─────────────
  if (!systemUser) {
    try {
      logger.info({
        event: 'keycloak_user_create_start',
        email,
        role,
      });
      const kcRoleName = getKeycloakRole(role);

      const keycloakUser = await keycloakService.adminAPI.users.create({
        realm: process.env.KEYCLOAK_REALM,
        username: email,
        email,
        emailVerified: false,
        firstName: prenom,
        lastName: nom,
        enabled: true,
        attributes: numero_telephone ? { numero_telephone: [numero_telephone] } : {},
        credentials: [
          {
            type: 'password',
            value: password,
            temporary: true,
          },
        ],
        requiredActions: ['UPDATE_PASSWORD'],
      });

      keycloak_id = keycloakUser.id;
      logger.info({
        event: 'keycloak_user_created',
        email,
        keycloak_id,
      });

      // ─── Step 3b: Assign realm role in Keycloak ────────────────
      if (kcRoleName) {
        try {
          const kcRole = await keycloakService.adminAPI.roles.findOneByName({
            realm: process.env.KEYCLOAK_REALM,
            name: kcRoleName,
          });

          if (kcRole) {
            await keycloakService.adminAPI.users.addRealmRoleMappings({
              realm: process.env.KEYCLOAK_REALM,
              id: keycloak_id,
              roles: [kcRole],
            });
            logger.info({
              event: 'keycloak_role_assigned',
              email,
              keycloak_id,
              role: kcRoleName,
            });
          }
        } catch (roleErr) {
          logger.warn({
            event: 'keycloak_role_assignment_failed',
            email,
            keycloak_id,
            role: kcRoleName,
            error: roleErr.message,
          });
          // Don't fail the entire operation if role assignment fails
          // The user can be re-assigned the role later
        }
      }
    } catch (kcErr) {
      if (kcErr instanceof ProvisioningError) throw kcErr;
      throw new ProvisioningError(
        'KEYCLOAK_ERROR',
        `Keycloak user creation failed: ${kcErr.message}`,
        { originalError: kcErr.message, email }
      );
    }
  } else {
    // System user: generate a random UUID (not tied to Keycloak)
    keycloak_id = crypto.randomUUID();
    logger.info({
      event: 'system_user_provisioning',
      email,
      keycloak_id,
      system_account: true,
    });
  }

  // ─── Step 3c: Generate invitation token (for account activation) ───
  let invitationToken = null;
  let invitationTokenExpire = null;
  if (!systemUser) {
    invitationToken = crypto.randomUUID();
    invitationTokenExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h
    logger.info({
      event: 'invitation_token_generated',
      email,
      invitation_token: invitationToken,
      expires_at: invitationTokenExpire,
    });
  }

  // ─── Step 4: Create in PostgreSQL (atomic transaction) ──────────
  let pgUser = null;
  try {
    logger.info({
      event: 'pg_user_create_start',
      email,
      keycloak_id,
      role,
    });

    pgUser = await tx.utilisateur.create({
      data: {
        keycloak_id,
        email,
        prenom,
        nom,
        numero_telephone: numero_telephone || null,
        adresse: adresse || null,
        mot_de_passe_hash: '', // Deprecated: Keycloak is the source of truth
        auth_provider: systemUser ? 'system' : 'keycloak',
        statut_compte: 'actif',
        created_by: createdBy.id_utilisateur || null,
        invitation_token: invitationToken || null,
        invitation_token_expire: invitationTokenExpire || null,
        invitation_sent_at: invitationToken ? new Date() : null,
        invitation_resend_count: 0,
        utilisateur_role: {
          create: {
            role,
            actif: true,
          },
        },
      },
      include: {
        utilisateur_role: { where: { actif: true } },
      },
    });

    logger.info({
      event: 'pg_user_created',
      email,
      id_utilisateur: pgUser.id_utilisateur,
      keycloak_id,
    });

    // ─── Step 4b: Create role-specific records ─────────────────────
    if (role === 'gestionnaire' && metadata.id_parking) {
      await tx.gestionnaire_parking.create({
        data: {
          id_gestionnaire: pgUser.id_utilisateur,
          id_parking: metadata.id_parking,
          date_prise_poste: new Date(),
        },
      });
      logger.info({
        event: 'gestionnaire_parking_linked',
        id_utilisateur: pgUser.id_utilisateur,
        id_parking: metadata.id_parking,
      });
    } else if (role === 'passager') {
      await tx.passager.create({
        data: { id_passager: pgUser.id_utilisateur },
      });
    } else if (role === 'chauffeur') {
      await tx.chauffeur.create({
        data: {
          id_chauffeur: pgUser.id_utilisateur,
          type_service: metadata.type_service || 'vtc',
          statut_validation: metadata.statut_validation || 'en_attente',
        },
      });
    } else if (role === 'proprietaire') {
      await tx.proprietaire.create({
        data: { id_proprietaire: pgUser.id_utilisateur },
      });
    }

    // Create wallet for non-system users (not admin, not system)
    if (role !== 'admin' && !systemUser) {
      await tx.portefeuille.create({
        data: { id_utilisateur: pgUser.id_utilisateur },
      });
    }
  } catch (pgErr) {
    // ─── Step 5: If PG fails → Rollback Keycloak ──────────────────
    if (!systemUser && keycloak_id) {
      logger.warn({
        event: 'pg_error_initiating_rollback',
        email,
        keycloak_id,
        pg_error: pgErr.message,
      });

      try {
        await keycloakService.adminAPI.users.del({
          realm: process.env.KEYCLOAK_REALM,
          id: keycloak_id,
        });
        logger.info({
          event: 'keycloak_rollback_success',
          email,
          keycloak_id,
        });
      } catch (rollbackErr) {
        logger.error({
          event: 'rollback_failed_manual_cleanup_required',
          level: 'CRITICAL',
          email,
          keycloak_id,
          pg_error: pgErr.message,
          rollback_error: rollbackErr.message,
          action: `DELETE user ${keycloak_id} from Keycloak manually`,
        });

        throw new ProvisioningError(
          'ROLLBACK_FAILED',
          `User creation failed in PostgreSQL, and Keycloak rollback also failed. Manual cleanup required.`,
          {
            email,
            keycloak_id,
            pg_error: pgErr.message,
            rollback_error: rollbackErr.message,
          }
        );
      }
    }

    throw new ProvisioningError(
      'PG_ERROR',
      `PostgreSQL user creation failed: ${pgErr.message}`,
      { originalError: pgErr.message, email, keycloak_id }
    );
  }

  // ─── Step 6: Send invitation email (non-blocking) ────────────────
  if (sendInvitationEmail && !systemUser && password) {
    try {
      await EmailService.sendUserInvitation(email, {
        nom,
        prenom,
        role,
        tempPassword: password,
        token: invitationToken,
        appUrl: process.env.APP_URL || 'http://localhost:3000',
      });
      logger.info({
        event: 'invitation_email_sent',
        email,
        invitation_token: invitationToken,
      });
    } catch (emailErr) {
      logger.warn({
        event: 'invitation_email_failed',
        email,
        error: emailErr.message,
      });
      // Non-blocking: don't fail the entire operation if email fails
    }
  }

  // ─── Step 7: Return result ────────────────────────────────────────
  logger.info({
    event: 'user_provisioning_success',
    email,
    id_utilisateur: pgUser.id_utilisateur,
    keycloak_id,
    role,
  });

  return {
    id_utilisateur: pgUser.id_utilisateur,
    keycloak_id,
    email,
    prenom,
    nom,
    role,
    ...(password && !systemUser && { tempPassword: password }),
  };
}

module.exports = {
  create,
  generateTempPassword,
  normalizeEmail,
  createUserInternal,
};
