// ── Résumé véhicule partagé par les vues "location de véhicule" ──────
//
// Utilisé par les deux côtés du flux de location (propriétaire et
// passager). À ne pas confondre avec `shared/models/location.dart`,
// qui est un modèle de géolocalisation GPS sans rapport.

class VehiculeResume {
  final String? marque;
  final String? modele;
  final int? annee;
  final String? immatriculation;

  const VehiculeResume({this.marque, this.modele, this.annee, this.immatriculation});

  String get nomComplet => '${marque ?? ''} ${modele ?? ''}'.trim();

  factory VehiculeResume.fromJson(Map<String, dynamic> json) {
    return VehiculeResume(
      marque: json['marque'] as String?,
      modele: json['modele'] as String?,
      annee: json['annee'] is num ? (json['annee'] as num).toInt() : null,
      immatriculation: json['immatriculation'] as String?,
    );
  }
}
