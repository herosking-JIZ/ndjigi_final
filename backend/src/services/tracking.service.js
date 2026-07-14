/**
 * SERVICES/TRACKING.SERVICE.JS
 * Logique réutilisable pour enregistrer les positions de véhicules
 */

const { prisma } = require('../config/db');

const HISTORY_SAMPLE_MS = 20 * 1000; // Historique : 1 insert max toutes les 20 sec par véhicule

/**
 * Enregistre la position d'un véhicule.
 * - Met TOUJOURS à jour la position courante (vehicule.latitude_actuelle/longitude_actuelle)
 *   → c'est ce que lit le partage de trajet.
 * - Insère dans tracking_vehicule UNIQUEMENT si le dernier point date de > HISTORY_SAMPLE_MS
 *   → évite l'explosion de la table.
 *
 * @param {string} id_vehicule
 * @param {object} params - { latitude, longitude, vitesse?, cap? }
 * @returns {Promise<object>} { archive: boolean }
 */
async function enregistrerPosition(id_vehicule, { latitude, longitude, vitesse, cap }) {
  // 1. Dernier point d'historique pour ce véhicule
  const dernier = await prisma.tracking_vehicule.findFirst({
    where: { id_vehicule },
    orderBy: { horodatage: 'desc' },
    select: { horodatage: true },
  });

  const doitArchiver =
    !dernier || (Date.now() - new Date(dernier.horodatage).getTime()) >= HISTORY_SAMPLE_MS;

  // 2. Transaction : position courante (toujours) + historique (échantillonné)
  await prisma.$transaction(async (tx) => {
    await tx.vehicule.update({
      where: { id_vehicule },
      data: {
        latitude_actuelle: parseFloat(latitude),
        longitude_actuelle: parseFloat(longitude),
        gps_actif: true,
      },
    });

    if (doitArchiver) {
      await tx.tracking_vehicule.create({
        data: {
          id_vehicule,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          vitesse: vitesse ? parseInt(vitesse) : null,
          cap: cap ? parseInt(cap) : null,
        },
      });
    }
  });

  return { archive: doitArchiver };
}

module.exports = { enregistrerPosition };
