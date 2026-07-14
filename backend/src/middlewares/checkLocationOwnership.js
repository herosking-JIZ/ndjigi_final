// backend/src/middlewares/checkLocationOwnership.js
const { prisma } = require('../config/db');
//
const checkLocationOwnership = async (req, res, next) => {
    try {
        // L'id de celui qui demande la ressource
        const userId = req.user.id_utilisateur;

        // l'id de la ressource
        const locationId = req.params.id;

        // le role de celui qui demande la ressource
        const rolesUser = req.user.utilisateur_role.map(r => r.role);

        // Admin bypass
        if (rolesUser.includes('admin')) return next();

        // Récupérer la location
        // location.vehicule pointe vers vehicule_location (sous-type location du véhicule),
        // qui n'a que id_vehicule comme PK : il faut inclure sa relation imbriquée vers
        // le vrai `vehicule` pour accéder à id_proprietaire.
        const location = await prisma.location.findUnique({
            where: { id_location: locationId },
            include: {
                passager: true,
                vehicule: { include: { vehicule: true } }
            }
        });

        if (!location) {
            return res.status(404).json({
                success: false,
                message: 'Location introuvable.'
            });
        }

        // Vérifier : c'est le passager OU le propriétaire du véhicule
        const estPassager = location.passager.id_passager === userId;
        const estProprietaire = location.vehicule.vehicule.id_proprietaire === userId;

        if (!estPassager && !estProprietaire) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé à cette location.'
            });
        }

        req.location = location;
        next();

    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

module.exports = { checkLocationOwnership };