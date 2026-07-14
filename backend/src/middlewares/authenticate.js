/**
 * MIDDLEWARES/AUTHENTICATE.JS
 * Alias principal pour le middleware d'authentification
 * Pointe vers keycloakAuth (validation JWKS/RS256 sûre)
 */

const { keycloakAuth } = require('./keycloakAuth');

module.exports = {
  authenticate: keycloakAuth
};
