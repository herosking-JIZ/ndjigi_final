/**
 * SERVICE/KEYCLOAKSERVICE.JS
 * Encapsule les appels Keycloak:
 *  - OpenID Connect token endpoints (login/refresh/logout)
 *  - Admin API (users, roles, realms, reset password, etc.)
 *
 * IMPORTANT (client admin dedie):
 * Si le client KEYCLOAK_ADMIN_CLIENT_ID n'existe pas encore, creer un client
 * "confidential" avec "Service Accounts Enabled" puis attribuer au service account:
 * - realm-management -> view-users
 * - realm-management -> manage-users
 */

const axios = require('axios');
const { URLSearchParams } = require('url');
const jwt = require('jsonwebtoken');
const KcAdminClient = require('@keycloak/keycloak-admin-client').default;
const { KEYCLOAK_URL, KEYCLOAK_REALM, KEYCLOAK_CLIENT_ID, KEYCLOAK_ALLOWED_ISSUERS } = require('../config/keycloak');

const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET || '';
const KEYCLOAK_ADMIN_CLIENT_ID = process.env.KEYCLOAK_ADMIN_CLIENT_ID || KEYCLOAK_CLIENT_ID;
const KEYCLOAK_ADMIN_CLIENT_SECRET = process.env.KEYCLOAK_ADMIN_CLIENT_SECRET || KEYCLOAK_CLIENT_SECRET;

const keycloakClient = axios.create({
  baseURL: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect`,
  timeout: 5000
});

let adminClient = null;
let adminAuthPromise = null;
let adminTokenExpiresAt = 0;

function getAdminClient() {
  if (adminClient) return adminClient;

  adminClient = new KcAdminClient({
    baseUrl: KEYCLOAK_URL,
    realmName: KEYCLOAK_REALM
  });

  return adminClient;
}

async function ensureAdminAuthenticated() {
  const client = getAdminClient();
  const now = Date.now();

  if (adminTokenExpiresAt > now + 60 * 1000) {
    return client;
  }

  if (adminAuthPromise) {
    await adminAuthPromise;
    return client;
  }

  if (!KEYCLOAK_ADMIN_CLIENT_SECRET) {
    throw new Error('Missing KEYCLOAK_ADMIN_CLIENT_SECRET for Keycloak Admin API.');
  }

  adminAuthPromise = (async () => {
    await client.auth({
      clientId: KEYCLOAK_ADMIN_CLIENT_ID,
      clientSecret: KEYCLOAK_ADMIN_CLIENT_SECRET,
      grantType: 'client_credentials'
    });

    const exp = client.accessTokenParsed?.exp;
    adminTokenExpiresAt = exp ? exp * 1000 : Date.now() + 60 * 1000;
    return client;
  })().finally(() => {
    adminAuthPromise = null;
  });

  await adminAuthPromise;
  return client;
}

function createAdminAPIProxy(path = []) {
  const callable = () => {};

  return new Proxy(callable, {
    get(_target, prop) {
      if (prop === 'then') return undefined;
      return createAdminAPIProxy([...path, prop]);
    },
    async apply(_target, _thisArg, args) {
      const client = await ensureAdminAuthenticated();
      const methodName = path[path.length - 1];
      const scopePath = path.slice(0, -1);
      const scope = scopePath.reduce((acc, key) => acc?.[key], client);
      const method = scope?.[methodName];

      if (typeof method !== 'function') {
        throw new Error(`Invalid Keycloak Admin API path: ${path.join('.')}`);
      }

      return method.apply(scope, args);
    }
  });
}

const adminAPI = createAdminAPIProxy();

/**
 * Login via Keycloak Direct Access Grant (Resource Owner Password)
 * @param {string} email
 * @param {string} password
 * @returns {object} { access_token, refresh_token, expires_in, token_type }
 */
async function login(email, password) {
  try {
    const auth = Buffer.from(`${KEYCLOAK_CLIENT_ID}:${KEYCLOAK_CLIENT_SECRET}`).toString('base64');
    const params = new URLSearchParams();

    params.append('grant_type', 'password');
    params.append('username', email);
    params.append('password', password);
    params.append('scope', 'openid profile email');

    const response = await keycloakClient.post('/token', params, {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return response.data;
  } catch (error) {
    const errorData = error.response?.data || {};
    const message = errorData.error_description || error.message;
    throw new Error(`Login failed: ${message}`);
  }
}

/**
 * Refresh access token
 * Dérive l'endpoint token à partir de l'issuer du refresh_token (allowlist security)
 * @param {string} refresh_token
 * @returns {object} { access_token, refresh_token, expires_in, token_type }
 */
async function refresh(refresh_token) {
  try {
    // Décoder le refresh_token pour lire son issuer (sans vérifier la signature)
    const decoded = jwt.decode(refresh_token, { complete: false });
    if (!decoded || !decoded.iss) {
      throw new Error('Refresh token mal formé (iss manquant)');
    }

    const tokenIssuer = decoded.iss;

    // Vérifier que l'issuer est dans la liste des issuers acceptables
    const allowedIssuers = KEYCLOAK_ALLOWED_ISSUERS || [KEYCLOAK_URL];
    if (!allowedIssuers.includes(tokenIssuer)) {
      throw new Error(`Invalid token issuer: "${tokenIssuer}" not in allowed list`);
    }

    // Construire l'endpoint token à partir de l'issuer du token
    // Format issuer: "http://192.168.11.104:8080/realms/ndjigi" ou "http://keycloak:8080/realms/ndjigi"
    const tokenEndpointUrl = `${tokenIssuer}/protocol/openid-connect/token`;

    const auth = Buffer.from(`${KEYCLOAK_CLIENT_ID}:${KEYCLOAK_CLIENT_SECRET}`).toString('base64');
    const params = new URLSearchParams();

    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refresh_token);
    params.append('scope', 'openid profile email');

    const response = await axios.post(tokenEndpointUrl, params, {
      timeout: 5000,
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return response.data;
  } catch (error) {
    const errorData = error.response?.data || {};
    const message = errorData.error_description || error.message;
    throw new Error(`Refresh failed: ${message}`);
  }
}

/**
 * Logout: invalide la session Keycloak
 * @param {string} refresh_token
 */
async function logout(refresh_token) {
  try {
    const params = new URLSearchParams();

    params.append('client_id', KEYCLOAK_CLIENT_ID);
    params.append('client_secret', KEYCLOAK_CLIENT_SECRET);
    params.append('refresh_token', refresh_token);

    await keycloakClient.post('/logout', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return { success: true };
  } catch (error) {
    console.warn(JSON.stringify({
      event: 'keycloak_logout_warning',
      message: error.message
    }));
    return { success: true };
  }
}

async function findUserByUsername(username) {
  const users = await adminAPI.users.find({
    realm: KEYCLOAK_REALM,
    username,
    exact: true
  });

  return users?.[0] || null;
}

module.exports = {
  login,
  refresh,
  logout,
  adminAPI,
  ensureAdminAuthenticated,
  findUserByUsername,
  KEYCLOAK_ADMIN_CLIENT_ID
};

