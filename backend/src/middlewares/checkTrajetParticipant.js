const { prisma } = require('../config/db');

/**
 * Autorise uniquement l'administrateur, le chauffeur affecté ou un passager
 * explicitement lié au trajet. Utilisé pour les lectures unitaires VTC.
 */
async function checkTrajetParticipant(req, res, next) {
  try {
    const idUtilisateur = req.user.id_utilisateur;
    const roles = req.user.utilisateur_role.map(({ role }) => role);

    const trajet = await prisma.trajet.findUnique({
      where: { id_trajet: req.params.id },
      select: {
        id_trajet: true,
        affectation_vehicule: { select: { id_chauffeur: true } },
        passagers_du_trajet: {
          where: { id_passager: idUtilisateur },
          select: { id_passager: true },
          take: 1,
        },
      },
    });

    if (!trajet) {
      return res.status(404).json({
        success: false,
        message: 'Trajet introuvable.',
        data: null,
        errors: null,
      });
    }

    const autorise = roles.includes('admin')
      || trajet.affectation_vehicule?.id_chauffeur === idUtilisateur
      || trajet.passagers_du_trajet.length > 0;

    if (!autorise) {
      return res.status(403).json({
        success: false,
        message: 'Ce trajet ne vous concerne pas.',
        data: null,
        errors: { code: 'TRAJET_FORBIDDEN' },
      });
    }

    req.ressource = trajet;
    return next();
  } catch (error) {
    console.error('[checkTrajetParticipant]', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.',
      data: null,
      errors: { code: 'INTERNAL_ERROR' },
    });
  }
}

module.exports = checkTrajetParticipant;
