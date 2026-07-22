/**
 * SERVICES/MATCHING.SERVICE.JS
 * Matching automatique chauffeur ↔ passager pour une demande de course VTC.
 *
 * Algorithme (voir docs/vtc.md côté Flutter pour la spec complète) :
 * - Éligibilité : chauffeur en_ligne, avec une affectation_vehicule active
 *   dont le véhicule (via vehicule_course) correspond à la catégorie
 *   demandée et a une position GPS connue.
 *   NB: trajet.id_affectation est une colonne requise par le schéma —
 *   un chauffeur qui aurait un vehicule_course sans jamais avoir eu
 *   d'affectation active ne peut donc pas (encore) recevoir de course.
 *   Le vehicule_course est créé dès l'enregistrement du véhicule par le
 *   chauffeur (POST /vehicules avec type: 'course', voir
 *   vehiculeController.creer) ; l'affectation (assigner un chauffeur actif
 *   à ce véhicule pour une prise de service) reste un acte séparé, géré par
 *   AffectationController.assigner.
 * - Tri par distance (Haversine) entre le point de départ du passager et
 *   la dernière position connue du véhicule, plafonné aux 15 plus proches.
 * - Proposition séquentielle : un seul candidat à la fois, délai de
 *   réponse 1 minute, on avance au suivant en cas de refus/timeout,
 *   jusqu'à épuisement de la liste ou 15 minutes au total.
 */

const { prisma } = require('../config/db');
const { getIO } = require('../socket/ioRegistry');

const DELAI_PROPOSITION_MS = Number(process.env.VTC_MATCHING_OFFER_SECONDS || 30) * 1000;
const DELAI_MAX_RECHERCHE_MS = Number(process.env.VTC_MATCHING_MAX_MINUTES || 10) * 60 * 1000;
const POSITION_MAX_AGE_MS = Number(process.env.VTC_POSITION_MAX_AGE_SECONDS || 120) * 1000;
const RAYON_MAX_KM = Number(process.env.VTC_MATCHING_RADIUS_KM || 25);
const MAX_CANDIDATS = Number(process.env.VTC_MATCHING_MAX_CANDIDATES || 15);

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/** Distance à vol d'oiseau entre deux points GPS, en kilomètres */
function distanceHaversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Cherche les chauffeurs éligibles pour une catégorie donnée, triés du
 * plus proche au plus loin du point de départ, plafonné à MAX_CANDIDATS.
 */
async function trouverCandidats({ id_categorie, latitude, longitude }) {
  const positionValideDepuis = new Date(Date.now() - POSITION_MAX_AGE_MS);
  const affectations = await prisma.affectation_vehicule.findMany({
    where: {
      est_active: true,
      chauffeur: { statut_disponibilite: 'en_ligne' },
      trajet: {
        none: { statut: { in: ['en_attente', 'chauffeur_trouve', 'confirme', 'en_cours'] } },
      },
      vehicule_course: {
        vehicule: {
          id_categorie,
          statut: 'disponible',
          gps_actif: true,
          latitude_actuelle: { not: null },
          longitude_actuelle: { not: null },
          tracking_vehicule: { some: { horodatage: { gte: positionValideDepuis } } },
        },
      },
    },
    include: {
      vehicule_course: { include: { vehicule: true } },
    },
  });

  const candidats = affectations.map((affectation) => {
    const vehicule = affectation.vehicule_course.vehicule;
    const distance_km = distanceHaversineKm(
      latitude,
      longitude,
      parseFloat(vehicule.latitude_actuelle),
      parseFloat(vehicule.longitude_actuelle)
    );
    return {
      id_affectation: affectation.id_affectation,
      id_chauffeur: affectation.id_chauffeur,
      distance_km,
    };
  });

  candidats.sort((a, b) => a.distance_km - b.distance_km);
  return candidats.filter((candidat) => candidat.distance_km <= RAYON_MAX_KM).slice(0, MAX_CANDIDATS);
}

async function proposerAuCandidat(trajet, idChauffeur) {
  getIO().of('/course').to(`user:${idChauffeur}`).emit('course:proposition', {
    id_trajet: trajet.id_trajet,
    adresse_depart: trajet.adresse_depart,
    adresse_arrivee: trajet.adresse_arrivee,
    distance_km: trajet.distance_km,
    tarif_estime: trajet.tarif_final,
    delai_reponse_secondes: DELAI_PROPOSITION_MS / 1000,
  });
}

/** Démarre le matching pour un trajet fraîchement créé (candidats déjà calculés) */
async function demarrerMatching(trajet, candidats) {
  if (candidats.length === 0) {
    await echecMatching(trajet.id_trajet);
    return;
  }

  const [premier, ...reste] = candidats;
  const maintenant = new Date();

  const trajetMisAJour = await prisma.trajet.update({
    where: { id_trajet: trajet.id_trajet },
    data: {
      id_affectation: premier.id_affectation,
      matching_candidats: reste,
      matching_demarre_a: maintenant,
      matching_expire_a: new Date(maintenant.getTime() + DELAI_PROPOSITION_MS),
    },
  });

  await proposerAuCandidat(trajetMisAJour, premier.id_chauffeur);
}

/**
 * Fait avancer la recherche au candidat suivant (refus explicite ou délai
 * dépassé). Termine la recherche en échec si la liste est épuisée ou si
 * le plafond de 15 minutes est atteint.
 */
async function avancerCandidatSuivant(idTrajet) {
  const trajet = await prisma.trajet.findUnique({ where: { id_trajet: idTrajet } });
  if (!trajet || trajet.statut !== 'en_attente') return;

  const dureeEcouleeMs = trajet.matching_demarre_a
    ? Date.now() - new Date(trajet.matching_demarre_a).getTime()
    : DELAI_MAX_RECHERCHE_MS;
  const candidatsRestants = Array.isArray(trajet.matching_candidats)
    ? trajet.matching_candidats
    : [];

  if (candidatsRestants.length === 0 || dureeEcouleeMs >= DELAI_MAX_RECHERCHE_MS) {
    await echecMatching(idTrajet);
    return;
  }

  let suivant = null;
  let reste = candidatsRestants;
  while (reste.length > 0 && !suivant) {
    const [candidat, ...apres] = reste;
    reste = apres;
    const encoreDisponible = await prisma.affectation_vehicule.findFirst({
      where: {
        id_affectation: candidat.id_affectation,
        est_active: true,
        chauffeur: { statut_disponibilite: 'en_ligne' },
        trajet: {
          none: {
            id_trajet: { not: idTrajet },
            statut: { in: ['en_attente', 'chauffeur_trouve', 'confirme', 'en_cours'] },
          },
        },
      },
      select: { id_affectation: true },
    });
    if (encoreDisponible) suivant = candidat;
  }
  if (!suivant) {
    await echecMatching(idTrajet);
    return;
  }
  const resultat = await prisma.trajet.updateMany({
    where: {
      id_trajet: idTrajet,
      id_affectation: trajet.id_affectation,
      statut: 'en_attente',
    },
    data: {
      id_affectation: suivant.id_affectation,
      matching_candidats: reste,
      matching_expire_a: new Date(Date.now() + DELAI_PROPOSITION_MS),
    },
  });
  if (resultat.count === 0) return;

  const trajetMisAJour = await prisma.trajet.findUnique({ where: { id_trajet: idTrajet } });

  await proposerAuCandidat(trajetMisAJour, suivant.id_chauffeur);
}

/** Aucun chauffeur trouvé/n'a accepté : annule le trajet et notifie le passager */
async function echecMatching(idTrajet) {
  const resultat = await prisma.trajet.updateMany({
    where: { id_trajet: idTrajet, statut: 'en_attente' },
    data: {
      statut: 'annule',
      matching_candidats: null,
      matching_expire_a: null,
    },
  });
  if (resultat.count === 0) return;

  const passagers = await prisma.detail_trajet_passager.findMany({
    where: { id_trajet: idTrajet },
  });

  if (passagers.length > 0) {
    await prisma.notification.createMany({
      data: passagers.map((p) => ({
        id_utilisateur: p.id_passager,
        type: 'course_aucun_chauffeur',
        titre: 'Aucun chauffeur disponible',
        contenu: 'Aucun chauffeur disponible à proximité. Essayez une autre catégorie de véhicule.',
        id_objet_lie: idTrajet,
      })),
    });
  }

  const io = getIO().of('/course');
  const payload = { id_trajet: idTrajet, statut: 'annule', raison: 'AUCUN_CHAUFFEUR_DISPONIBLE' };
  io.to(`trajet:${idTrajet}`).emit('course:statut_change', payload);
  for (const p of passagers) {
    io.to(`user:${p.id_passager}`).emit('course:statut_change', payload);
  }
}

module.exports = {
  distanceHaversineKm,
  trouverCandidats,
  demarrerMatching,
  avancerCandidatSuivant,
  echecMatching,
  DELAI_PROPOSITION_MS,
  DELAI_MAX_RECHERCHE_MS,
  MAX_CANDIDATS,
  POSITION_MAX_AGE_MS,
  RAYON_MAX_KM,
};
