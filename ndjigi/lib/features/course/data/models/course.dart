// ignore_for_file: invalid_annotation_target
import 'package:freezed_annotation/freezed_annotation.dart';

part 'course.freezed.dart';
part 'course.g.dart';

double? _parseDoubleNullable(dynamic value) {
  if (value == null) return null;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}

// ── Course (trajet VTC) ────────────────────────────────────────────

@freezed
class Course with _$Course {
  const factory Course({
    @JsonKey(name: 'id_trajet') required String idTrajet,
    @JsonKey(name: 'id_chauffeur') String? idChauffeur,
    @JsonKey(name: 'adresse_depart') required String adresseDepart,
    @JsonKey(name: 'adresse_arrivee') required String adresseArrivee,
    @JsonKey(name: 'distance_km', fromJson: _parseDoubleNullable)
    double? distanceKm,
    @JsonKey(name: 'duree_estimee_min') int? dureeEstimeeMin,
    @JsonKey(name: 'date_heure_debut') DateTime? dateHeureDebut,
    @JsonKey(name: 'date_heure_fin') DateTime? dateHeureFin,
    @Default('en_attente') String statut,
    @JsonKey(name: 'type_trajet') @Default('vtc') String typeTrajet,
    @JsonKey(name: 'tarif_final', fromJson: _parseDoubleNullable)
    double? tarifFinal,
    @JsonKey(name: 'coordonnees_depart')
    Map<String, dynamic>? coordonneesDepart,
    @JsonKey(name: 'coordonnees_arrivee')
    Map<String, dynamic>? coordonneesArrivee,
    @JsonKey(name: 'polyline_trajet') String? polylineTrajet,
    @JsonKey(name: 'confirmation_chauffeur')
    @Default(false)
    bool confirmationChauffeur,
    @JsonKey(name: 'confirmation_passager')
    @Default(false)
    bool confirmationPassager,
    @JsonKey(name: 'identite_confirmee') @Default(false) bool identiteConfirmee,
    @JsonKey(name: 'chauffeur_arrive_a') DateTime? chauffeurArriveA,
    @JsonKey(name: 'id_conversation') String? idConversation,
    @JsonKey(name: 'motif_annulation') String? motifAnnulation,
    @JsonKey(name: 'chauffeur_nom') String? chauffeurNom,
    @JsonKey(name: 'chauffeur_photo') String? chauffeurPhoto,
    @JsonKey(name: 'chauffeur_telephone') String? chauffeurTelephone,
    @JsonKey(name: 'chauffeur_note', fromJson: _parseDoubleNullable)
    double? chauffeurNote,
    @JsonKey(name: 'vehicule_marque') String? vehiculeMarque,
    @JsonKey(name: 'vehicule_modele') String? vehiculeModele,
    @JsonKey(name: 'vehicule_couleur') String? vehiculeCouleur,
    @JsonKey(name: 'vehicule_immatriculation') String? vehiculeImmatriculation,
  }) = _Course;

  factory Course.fromJson(Map<String, dynamic> json) => _$CourseFromJson(json);
}

// ── CategorieVehicule ────────────────────────────────────────────────

@freezed
class CategorieVehicule with _$CategorieVehicule {
  const factory CategorieVehicule({
    @JsonKey(name: 'id_categorie') required String idCategorie,
    required String nom,
    String? description,
    @Default(true) bool actif,
  }) = _CategorieVehicule;

  factory CategorieVehicule.fromJson(Map<String, dynamic> json) =>
      _$CategorieVehiculeFromJson(json);
}
