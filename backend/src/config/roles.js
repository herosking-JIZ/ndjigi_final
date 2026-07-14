/**
 * CONFIG/ROLES.JS — Définition des rôles et permissions N'DJIGI
 *
 * Convention des permissions : "ressource:action"
 * L'admin a tout via le wildcard '*'
 */

const ROLES_PERMISSIONS = {

  passager: [
    // Profil
    'profil:lire',
    'profil:modifier',
    // Trajets
    'trajet:lire',
    'trajet:reserver',
    'trajet:annuler',
    // Location
    'location:lire',
    'location:creer',
    'location:annuler',
    // Avis
    'avis:creer',
    'avis:lire',
    // Paiement
    'paiement:creer',
    'paiement:lire',
    // Portefeuille
    'portefeuille:lire',
    'portefeuille:recharger',
    'portefeuille:retirer',
    'portefeuille:transferer',
    // Documents
    'document:soumettre',
    // Codes promo
    'promo:utiliser',
    // Notifications
    'notification:lire',
    'notification:marquer_lu',

    // Support (users can only create tickets, agents handle the rest)
    'support:creer_ticket',

    // remboursements
    'remboursement:demander',
  ],

  chauffeur: [
    // Profil
    'profil:lire',
    'profil:modifier',
    // Trajets
    'trajet:lire',
    'trajet:accepter',
    'trajet:demarrer',
    'trajet:terminer',
    'trajet:annuler',
    // Véhicules (son propre véhicule de course)
    'vehicule:creer',
    'vehicule:lire',
    'vehicule:modifier',
    'vehicule:supprimer',
    // Disponibilité
    'disponibilite:modifier',
    // Avis
    'avis:lire',
    // Portefeuille
    'portefeuille:lire',
    'portefeuille:recharger',
    'portefeuille:retirer',
    'portefeuille:transferer',
    // Documents
    'document:soumettre',
    // Incidents
    'incident:declarer',
    // Tracking GPS
    'tracking:envoyer',
    // Notifications
    'notification:lire',
    'notification:marquer_lu',

    // Support (users can only create tickets, agents handle the rest)
    'support:creer_ticket',

    // remboursements
    'remboursement:demander',
  ],

  proprietaire: [
    // Profil
    'profil:lire',
    'profil:modifier',
    'proprietaire:lire',
    // Véhicules
    'vehicule:creer',
    'vehicule:lire',
    'vehicule:modifier',
    'vehicule:supprimer',
    // Locations
    'location:lire',
    'location:gerer',
    // Portefeuille
    'portefeuille:lire',
    'portefeuille:recharger',
    'portefeuille:retirer',
    'portefeuille:transferer',
    // Documents
    'document:soumettre',
    // Avis
    'avis:lire',
    // Tracking (ses propres véhicules)
    'tracking:lire',
    // Notifications
    'notification:lire',
    'notification:marquer_lu',

    // Support (users can only create tickets, agents handle the rest)
    'support:creer_ticket',

    // remboursements
    'remboursement:demander',
  ],

  gestionnaire: [
    // Profil
    'profil:lire',
    // Parking
    'parking:lire',
    'parking:gerer',
    // Journal parking
    'journal_parking:creer',
    'journal_parking:lire',
    // Véhicules
    'vehicule:lire',
    'vehicule:modifier_statut',
    // Notifications
    'notification:lire',
    'notification:marquer_lu',

    // Support (users can only create tickets, agents handle the rest)
    'support:creer_ticket',

    // remboursements
    'remboursement:demander',
  ],

  admin: [
    // L'admin a toutes les permissions
    '*'
  ]
};

/**
 * Vérifie si une liste de rôles possède une permission donnée
 * @param {string[]} roles
 * @param {string} permission
 * @returns {boolean}
 */
function hasPermission(roles, permission) {
  if (!Array.isArray(roles)) roles = [roles];
  for (const role of roles) {
    const permissions = ROLES_PERMISSIONS[role] || [];
    if (permissions.includes('*'))          return true;
    if (permissions.includes(permission))   return true;
  }
  return false;
}

/**
 * Retourne la liste complète des permissions pour un ou plusieurs rôles
 * @param {string|string[]} roles
 * @returns {string[]}
 */
function getPermissions(roles) {
  if (!Array.isArray(roles)) roles = [roles];
  const perms = new Set();
  for (const role of roles) {
    const permissions = ROLES_PERMISSIONS[role] || [];
    permissions.forEach(p => perms.add(p));
  }
  return [...perms];
}

/**
 * Retourne la liste de tous les rôles valides
 * @returns {string[]}
 */
function getRolesValides() {
  return Object.keys(ROLES_PERMISSIONS);
}

module.exports = { ROLES_PERMISSIONS, hasPermission, getPermissions, getRolesValides };