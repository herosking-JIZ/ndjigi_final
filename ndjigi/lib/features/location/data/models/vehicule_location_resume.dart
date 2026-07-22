// ── Résultat de recherche : véhicule disponible à la location ────────
//
// Miroir de la réponse aplatie de GET /locations/vehicules
// (locationController.js → rechercherVehicules).

import '../../../../core/utils/json_parsers.dart';

class VehiculeLocationResume {
  final String idVehicule;
  final String marque;
  final String modele;
  final int? annee;
  final String? couleur;
  final String? photoPrincipale;
  final double? tarifBaseLocation;
  final double? tarifParJourLocation;

  const VehiculeLocationResume({
    required this.idVehicule,
    required this.marque,
    required this.modele,
    this.annee,
    this.couleur,
    this.photoPrincipale,
    this.tarifBaseLocation,
    this.tarifParJourLocation,
  });

  String get nomComplet => '$marque $modele'.trim();

  factory VehiculeLocationResume.fromJson(Map<String, dynamic> json) {
    return VehiculeLocationResume(
      idVehicule: json['id_vehicule'] as String,
      marque: json['marque'] as String? ?? '',
      modele: json['modele'] as String? ?? '',
      annee: json['annee'] is num ? (json['annee'] as num).toInt() : null,
      couleur: json['couleur'] as String?,
      photoPrincipale: json['photo_principale'] as String?,
      tarifBaseLocation: parseDoubleNullable(json['tarif_base_location']),
      tarifParJourLocation: parseDoubleNullable(json['tarif_par_jour_location']),
    );
  }
}
