/**
 * Configuration Keycloak
 * Utilisé pour : validation tokens via JWKS
 *
 * Usage:
 *   const { verifyKeycloakToken, getJwksClient } = require('./keycloak');
 *   const verified = await verifyKeycloakToken(token);
 */

const jwksClient = require('jwks-rsa');
const jwt = require('jsonwebtoken');

// ─── Constantes ───
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'ndjigi';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'ndjigi-backend';
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET;

// Liste des issuers acceptables (pour dev multi-réseau)
let KEYCLOAK_ALLOWED_ISSUERS = null;
if (process.env.KEYCLOAK_ALLOWED_ISSUERS) {
  KEYCLOAK_ALLOWED_ISSUERS = process.env.KEYCLOAK_ALLOWED_ISSUERS.split(',').map(s => s.trim());
  console.log(`✅ KEYCLOAK_ALLOWED_ISSUERS chargé:`, KEYCLOAK_ALLOWED_ISSUERS);
} else {
  console.warn(`⚠️ KEYCLOAK_ALLOWED_ISSUERS non défini, utilisation du comportement par défaut`);
}

// ─── JWKS Client (pour validation tokens) ───
let kcJwksClient = null;

/**
 * Récupère le client JWKS pour valider les tokens Keycloak (singleton)
 */
function getJwksClient() {
  if (kcJwksClient) return kcJwksClient;

  const jwksUri = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`;

  kcJwksClient = jwksClient({
    jwksUri,
    cache: true,
    cacheMaxEntries: 10,
    cacheMaxAge: 3600000, // 1 hour
  });

  console.log(`✅ JWKS Client créé`);
  return kcJwksClient;
}

/**
 * Valide et décode un token Keycloak
 * Vérifie : signature RS256, expiration, issuer
 *
 * @param {string} token - JWT Keycloak Bearer token
 * @returns {object} - Payload du token vérifié
 * @throws {Error} - Si le token est invalide
 */
async function verifyKeycloakToken(token) {
  try {
    const decoded = jwt.decode(token, { complete: true });

    if (!decoded) {
      throw new Error('Token non décodable');
    }

    const { header, payload } = decoded;

    if (!header.kid) {
      throw new Error('header.kid manquant');
    }

    // Récupérer la clé publique via JWKS
    const key = await getJwksClient().getSigningKey(header.kid);
    const publicKey = key.getPublicKey();

    // Vérifier la signature et l'expiration
    const issuerOption = KEYCLOAK_ALLOWED_ISSUERS || `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`;

    const verified = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: issuerOption,
    });

    return verified;
  } catch (err) {
    const errorMessage = err.message || 'Erreur inconnue';
    throw new Error(`Token Keycloak invalide: ${errorMessage}`);
  }
}

module.exports = {
  getJwksClient,
  verifyKeycloakToken,
  KEYCLOAK_URL,
  KEYCLOAK_REALM,
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_ALLOWED_ISSUERS,
};
