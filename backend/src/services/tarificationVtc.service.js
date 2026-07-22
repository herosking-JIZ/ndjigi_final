const { prisma } = require('../config/db');

class TarificationVtcError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'TarificationVtcError';
    this.code = code;
  }
}

/** Point d'extension du futur moteur GeoJSON point-dans-polygone. */
async function resoudreZone({ idCategorie, idZone, coordonneesDepart }) {
  void coordonneesDepart;
  const idZoneCandidate = idZone || process.env.VTC_DEFAULT_ZONE_ID || null;

  if (idZoneCandidate) {
    const grille = await prisma.tarif_categorie_zone.findUnique({
      where: { id_zone_id_categorie: { id_zone: idZoneCandidate, id_categorie: idCategorie } },
      include: { zone_tarifaire: true },
    });
    if (!grille?.actif || !grille.zone_tarifaire?.actif || grille.zone_tarifaire.supprime_le) {
      throw new TarificationVtcError('ZONE_SANS_TARIF', 'Aucune grille tarifaire active pour cette zone et cette catégorie.');
    }
    return grille;
  }

  const grilles = await prisma.tarif_categorie_zone.findMany({
    where: {
      id_categorie: idCategorie,
      actif: true,
      zone_tarifaire: { actif: true, supprime_le: null },
    },
    include: { zone_tarifaire: true },
    take: 2,
    orderBy: { zone_tarifaire: { nom: 'asc' } },
  });

  if (grilles.length === 0) {
    throw new TarificationVtcError('TARIF_INTROUVABLE', 'Aucun tarif VTC actif pour cette catégorie.');
  }
  if (grilles.length > 1) {
    throw new TarificationVtcError('ZONE_AMBIGUE', 'Plusieurs zones tarifaires sont disponibles. Configurez VTC_DEFAULT_ZONE_ID.');
  }
  return grilles[0];
}

async function calculerDevisVtc({ idCategorie, idZone, coordonneesDepart, distanceKm, dureeMin, coefficient = 1 }) {
  const grille = await resoudreZone({ idCategorie, idZone, coordonneesDepart });
  const coefficientMax = Number(grille.zone_tarifaire.coefficient_max);
  const coefficientApplique = Math.min(Math.max(Number(coefficient) || 1, 1), coefficientMax);
  const tarifHt = Number(grille.tarif_base)
    + Number(grille.tarif_km) * Number(distanceKm)
    + Number(grille.tarif_minute) * Number(dureeMin);

  return {
    id_zone: grille.id_zone,
    zone_nom: grille.zone_tarifaire.nom,
    id_categorie: grille.id_categorie,
    distance_km: Number(distanceKm),
    duree_min: Number(dureeMin),
    coefficient: coefficientApplique,
    tarif_ht: Number(tarifHt.toFixed(2)),
    tarif_final: Number((tarifHt * coefficientApplique).toFixed(2)),
    tarif_max: Number((tarifHt * coefficientMax).toFixed(2)),
    devise: 'XOF',
  };
}

module.exports = { calculerDevisVtc, resoudreZone, TarificationVtcError };
