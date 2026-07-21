const { prisma } = require('../config/db');

/**
 * Limite un gestionnaire au parking qui lui est affecté.
 * Les administrateurs conservent l'accès transversal nécessaire à la supervision.
 */
async function requireParkingAccess(req, res, next) {
  try {
    const parkingId = req.params.parkingId || req.params.id;
    const roles = (req.user?.utilisateur_role || [])
      .filter((item) => item.actif !== false)
      .map((item) => item.role);

    if (roles.includes('admin')) return next();

    if (!parkingId || !roles.includes('gestionnaire')) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à ce parking.'
      });
    }

    const affectation = await prisma.gestionnaire_parking.findFirst({
      where: {
        id_gestionnaire: req.user.id_utilisateur,
        id_parking: parkingId
      },
      select: { id_parking: true }
    });

    if (!affectation) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas affecté à ce parking."
      });
    }

    return next();
  } catch (error) {
    console.error('[parkingAccess]', error);
    return res.status(500).json({ success: false, message: 'Erreur de contrôle d’accès.' });
  }
}

module.exports = { requireParkingAccess };
