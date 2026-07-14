
// Middleware spécifique pour tracking
const { prisma } = require('../config/db');
const checkOwnershipTracking = async (req, res, next) => {
    try {
        const userId = req.user.id_utilisateur;
        const trackingId = req.params.id;
        const rolesUser = req.user.utilisateur_role.map(r => r.role);

        if (rolesUser.includes('admin')) return next();

        const tracking = await prisma.tracking_vehicule.findUnique({
            where: { id_tracking: trackingId },
            include: { vehicule: { include: { affectation_vehicule: true } } }
        });

        if (!tracking) {
            return res.status(404).json({ message: 'Tracking introuvable.' });
        }

        // Vérifier : propriétaire du véhicule OU chauffeur affecté
        const estProprietaire = tracking.vehicule.id_proprietaire === userId;
        const estChauffeur = tracking.vehicule.affectation_vehicule?.id_chauffeur === userId;

        if (!estProprietaire && !estChauffeur) {
            return res.status(403).json({ message: 'Accès refusé.' });
        }

        req.tracking = tracking;
        next();

    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
module.exports = checkOwnershipTracking;