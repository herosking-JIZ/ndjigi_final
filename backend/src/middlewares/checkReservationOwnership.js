// backend/src/middlewares/checkReservationOwnership.js

const { prisma } = require('../config/db');
const checkReservationOwnership = async (req, res, next) => {
    try {
        const userId = req.user.id_utilisateur;
        const reservationId = req.params.id;
        const rolesUser = req.user.utilisateur_role.map(r => r.role);

        // Admin bypass
        if (rolesUser.includes('admin')) return next();

        // Récupérer la réservation
        const reservation = await prisma.reservation.findUnique({
            where: { id_reservation: reservationId },
            include: { 
                passager: true,
                trajet: { include: { affectation_vehicule: true } }
            }
        });

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Réservation introuvable.'
            });
        }

        // Vérifier : c'est le passager OU le chauffeur affecté
        const estPassager = reservation.passager.id_passager === userId;
        const estChauffeur = reservation.trajet.affectation_vehicule.id_chauffeur === userId;

        if (!estPassager && !estChauffeur) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé à cette réservation.'
            });
        }

        req.reservation = reservation;
        next();

    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

module.exports =  checkReservationOwnership ;