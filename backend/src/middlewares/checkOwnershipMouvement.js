const { prisma } = require('../config/db');
// Middleware spécifique
const checkOwnershipMouvement = async (req, res, next) => {
    try {
        const userId = req.user.id_utilisateur;
        const mouvementId = req.params.id;

        const mouvement = await prisma.mouvement_portefeuille.findUnique({
            where: { id_mouvement: mouvementId },
            include: { portefeuille: true }
        });

        if (!mouvement) {
            return res.status(404).json({ message: 'Mouvement introuvable.' });
        }

        // Vérifier que c'est son portefeuille
        if (mouvement.portefeuille.id_utilisateur !== userId) {
            return res.status(403).json({ message: 'Accès refusé.' });
        }

        req.mouvement = mouvement;
        next();

    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

module.exports = checkOwnershipMouvement;