/**
 * JOBS/MATCHINGSWEEP.JS
 * Balayage périodique des trajets en recherche de chauffeur (statut
 * 'en_attente') dont la proposition au candidat courant a expiré (délai
 * de 1 minute dépassé) : fait avancer au candidat suivant, ou termine la
 * recherche en échec si la liste est épuisée / 15 minutes dépassées.
 *
 * Nécessaire car il n'existe pas d'infrastructure de tâches planifiées
 * dans ce backend (pas de file de jobs) — un setInterval() régulier
 * (app.js) suffit ici, l'état de progression étant stocké en base
 * (trajet.matching_*) plutôt qu'en mémoire, pour survivre à un
 * redémarrage du serveur pendant une recherche en cours.
 */

const { prisma } = require('../config/db');
const { avancerCandidatSuivant } = require('../services/matching.service');

async function matchingSweep() {
  const expires = await prisma.trajet.findMany({
    where: {
      statut: 'en_attente',
      matching_expire_a: { lte: new Date() },
    },
    select: { id_trajet: true },
  });

  for (const { id_trajet } of expires) {
    try {
      await avancerCandidatSuivant(id_trajet);
    } catch (error) {
      console.error(JSON.stringify({
        event: 'matching_sweep_advance_failed',
        id_trajet,
        error: error.message,
      }));
    }
  }

  return { traites: expires.length };
}

module.exports = { matchingSweep };
