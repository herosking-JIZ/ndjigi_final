// middlewares/checkOwnership.js
const { prisma } = require('../config/db');

/**
 * Vérifie que la ressource appartient à l'utilisateur connecté.
 * L'admin bypasse toujours ce check.
 *
 * @param {string} model          - Nom du modèle Prisma  ex: 'vehicule'
 * @param {string} paramId        - Nom du param URL      ex: 'id'
 * @param {string} champFK        - Champ FK propriétaire ex: 'id_proprietaire'
 * @param {string} champPK        - Clé primaire du model ex: 'id_vehicule'
 */
const checkOwnership = (model, paramId, champFK, champPK) => {
    return async (req, res, next) => {
        try {
            const idRessource = req.params[paramId];
            const idUser      = req.user.id_utilisateur;
            const rolesUser   = req.user.utilisateur_role.map(r => r.role);

            // Admin bypass — il a tous les droits
            if (rolesUser.includes('admin')) return next();

            // Récupérer la ressource en base
            const ressource = await prisma[model].findUnique({
                where: { [champPK]: idRessource }
            });

            if (!ressource) {
                return res.status(404).json({
                    success: false,
                    message: 'Ressource introuvable.'
                });
            }

            // Vérifier l'appartenance
            if (ressource[champFK] !== idUser) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé : cette ressource ne vous appartient pas.'
                });
            }

            // Attacher la ressource à req pour éviter un 2e appel DB dans le controller
            req.ressource = ressource;
            next();

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la vérification des droits.'
            });
        }
    };
};

module.exports =  checkOwnership ;