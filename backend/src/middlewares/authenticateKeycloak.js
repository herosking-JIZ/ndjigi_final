/**
 * MIDDLEWARES/AUTHENTICATEKEYCLOAK.JS
 * ⚠️ DEPRECATED: Wrapper vers keycloakAuth (version sûre avec JWKS/RS256)
 *
 * Ce fichier ré-exporte keycloakAuth pour la rétrocompatibilité.
 * Tous les chemins de code passent maintenant par la validation JWKS
 * sûre via services/auth/resolveUser.js
 *
 * NE JAMAIS utiliser jwt.decode() sans vérification de signature.
 */

const { keycloakAuth } = require('./keycloakAuth');

const authenticateKeycloak = keycloakAuth;

module.exports = { authenticateKeycloak };
