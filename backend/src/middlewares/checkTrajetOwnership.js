// middlewares/checkTrajetOwnership.js

const { prisma } = require('../config/db');

// Middleware pour vérifier que le chauffeur connecté est bien celui affecté au trajet
const checkTrajetChauffeur = async (req, res, next) => {
    const trajet = await prisma.trajet.findUnique({
        where: { id_trajet: req.params.id },
        include: { affectation_vehicule: true }
    });

    if (!trajet) return res.status(404).json({ message: 'Trajet introuvable.' });

    const rolesUser = req.user.utilisateur_role.map(r => r.role);

    // Admin bypass
    if (rolesUser.includes('admin')) {
        req.ressource = trajet;
        return next();
    }

    // Vérifier que le chauffeur connecté est bien celui affecté à ce trajet
    const estLeChauffeur = trajet.affectation_vehicule.id_chauffeur === req.user.id_utilisateur;

    if (!estLeChauffeur) {
        return res.status(403).json({ message: 'Ce trajet ne vous est pas affecté.' });
    }

    req.ressource = trajet;
    next();
};

module.exports = checkTrajetChauffeur;