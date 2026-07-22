// ── Détail public d'un véhicule de location ───────────────────────────
//
// Miroir de la réponse de GET /locations/vehicules/:id
// (locationController.js → detailVehicule).

import '../../../../core/utils/json_parsers.dart';

class ProprietaireResume {
  final String? nom;
  final String? prenom;

  const ProprietaireResume({this.nom, this.prenom});

  String get nomComplet => '${prenom ?? ''} ${nom ?? ''}'.trim();

  factory ProprietaireResume.fromJson(Map<String, dynamic> json) {
    return ProprietaireResume(
      nom: json['nom'] as String?,
      prenom: json['prenom'] as String?,
    );
  }
}

class VehiculeLocationDetail {
  final String idVehicule;
  final String marque;
  final String modele;
  final int annee;
  final String? couleur;
  final String immatriculation;
  final int nbPlaces;
  final bool climatisation;
  final bool gpsActif;
  final String statut;
  final double? tarifBaseLocation;
  final double? tarifParJourLocation;
  final double? noteMoyenne;
  final ProprietaireResume proprietaire;

  const VehiculeLocationDetail({
    required this.idVehicule,
    required this.marque,
    required this.modele,
    required this.annee,
    this.couleur,
    required this.immatriculation,
    required this.nbPlaces,
    this.climatisation = false,
    this.gpsActif = false,
    this.statut = 'disponible',
    this.tarifBaseLocation,
    this.tarifParJourLocation,
    this.noteMoyenne,
    required this.proprietaire,
  });

  String get nomComplet => '$marque $modele'.trim();

  factory VehiculeLocationDetail.fromJson(Map<String, dynamic> json) {
    final proprietaireJson = json['proprietaire'];
    return VehiculeLocationDetail(
      idVehicule: json['id_vehicule'] as String,
      marque: json['marque'] as String? ?? '',
      modele: json['modele'] as String? ?? '',
      annee: parseIntWithFallback(json['annee']),
      couleur: json['couleur'] as String?,
      immatriculation: json['immatriculation'] as String? ?? '',
      nbPlaces: parseIntWithFallback(json['nb_places'], fallback: 1),
      climatisation: json['climatisation'] as bool? ?? false,
      gpsActif: json['gps_actif'] as bool? ?? false,
      statut: json['statut'] as String? ?? 'disponible',
      tarifBaseLocation: parseDoubleNullable(json['tarif_base_location']),
      tarifParJourLocation: parseDoubleNullable(json['tarif_par_jour_location']),
      noteMoyenne: parseDoubleNullable(json['note_moyenne']),
      proprietaire: proprietaireJson is Map<String, dynamic>
          ? ProprietaireResume.fromJson(proprietaireJson)
          : const ProprietaireResume(),
    );
  }
}
