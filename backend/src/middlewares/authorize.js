const { hasPermission } = require('../config/roles');

/**
 * Vérifie le RÔLE de l'utilisateur
 * Usage : authorize('admin', 'gestionnaire')
 */
const authorize = (...rolesRequis) => {
  return (req, res, next) => {
    const rolesUser = req.user.utilisateur_role.map(r => r.role);
    const aLeRole   = rolesRequis.some(role => rolesUser.includes(role));

    if (!aLeRole) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé. Rôle requis : ${rolesRequis.join(' ou ')}.`
      });
    }
    next();
  };
};

/**
 * Vérifie la PERMISSION de l'utilisateur
 * Usage : can('trajet:reserver')
 */
const can = (permission) => {
  return (req, res, next) => {
    const rolesUser = req.user.utilisateur_role.map(r => r.role);

    if (!hasPermission(rolesUser, permission)) {
      return res.status(403).json({
        success: false,
        message: `Action non autorisée : permission "${permission}" requise.`
      });
    }
    next();
  };
};

module.exports = { authorize, can };