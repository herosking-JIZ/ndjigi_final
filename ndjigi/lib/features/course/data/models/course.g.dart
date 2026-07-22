// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'course.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$CourseImpl _$$CourseImplFromJson(Map<String, dynamic> json) => _$CourseImpl(
  idTrajet: json['id_trajet'] as String,
  idChauffeur: json['id_chauffeur'] as String?,
  adresseDepart: json['adresse_depart'] as String,
  adresseArrivee: json['adresse_arrivee'] as String,
  distanceKm: _parseDoubleNullable(json['distance_km']),
  dureeEstimeeMin: (json['duree_estimee_min'] as num?)?.toInt(),
  dateHeureDebut: json['date_heure_debut'] == null
      ? null
      : DateTime.parse(json['date_heure_debut'] as String),
  dateHeureFin: json['date_heure_fin'] == null
      ? null
      : DateTime.parse(json['date_heure_fin'] as String),
  statut: json['statut'] as String? ?? 'en_attente',
  typeTrajet: json['type_trajet'] as String? ?? 'vtc',
  tarifFinal: _parseDoubleNullable(json['tarif_final']),
  coordonneesDepart: json['coordonnees_depart'] as Map<String, dynamic>?,
  coordonneesArrivee: json['coordonnees_arrivee'] as Map<String, dynamic>?,
  polylineTrajet: json['polyline_trajet'] as String?,
  confirmationChauffeur: json['confirmation_chauffeur'] as bool? ?? false,
  confirmationPassager: json['confirmation_passager'] as bool? ?? false,
  identiteConfirmee: json['identite_confirmee'] as bool? ?? false,
  chauffeurArriveA: json['chauffeur_arrive_a'] == null
      ? null
      : DateTime.parse(json['chauffeur_arrive_a'] as String),
  idConversation: json['id_conversation'] as String?,
  motifAnnulation: json['motif_annulation'] as String?,
  chauffeurNom: json['chauffeur_nom'] as String?,
  chauffeurPhoto: json['chauffeur_photo'] as String?,
  chauffeurTelephone: json['chauffeur_telephone'] as String?,
  chauffeurNote: _parseDoubleNullable(json['chauffeur_note']),
  vehiculeMarque: json['vehicule_marque'] as String?,
  vehiculeModele: json['vehicule_modele'] as String?,
  vehiculeCouleur: json['vehicule_couleur'] as String?,
  vehiculeImmatriculation: json['vehicule_immatriculation'] as String?,
);

Map<String, dynamic> _$$CourseImplToJson(_$CourseImpl instance) =>
    <String, dynamic>{
      'id_trajet': instance.idTrajet,
      'id_chauffeur': instance.idChauffeur,
      'adresse_depart': instance.adresseDepart,
      'adresse_arrivee': instance.adresseArrivee,
      'distance_km': instance.distanceKm,
      'duree_estimee_min': instance.dureeEstimeeMin,
      'date_heure_debut': instance.dateHeureDebut?.toIso8601String(),
      'date_heure_fin': instance.dateHeureFin?.toIso8601String(),
      'statut': instance.statut,
      'type_trajet': instance.typeTrajet,
      'tarif_final': instance.tarifFinal,
      'coordonnees_depart': instance.coordonneesDepart,
      'coordonnees_arrivee': instance.coordonneesArrivee,
      'polyline_trajet': instance.polylineTrajet,
      'confirmation_chauffeur': instance.confirmationChauffeur,
      'confirmation_passager': instance.confirmationPassager,
      'identite_confirmee': instance.identiteConfirmee,
      'chauffeur_arrive_a': instance.chauffeurArriveA?.toIso8601String(),
      'id_conversation': instance.idConversation,
      'motif_annulation': instance.motifAnnulation,
      'chauffeur_nom': instance.chauffeurNom,
      'chauffeur_photo': instance.chauffeurPhoto,
      'chauffeur_telephone': instance.chauffeurTelephone,
      'chauffeur_note': instance.chauffeurNote,
      'vehicule_marque': instance.vehiculeMarque,
      'vehicule_modele': instance.vehiculeModele,
      'vehicule_couleur': instance.vehiculeCouleur,
      'vehicule_immatriculation': instance.vehiculeImmatriculation,
    };

_$CategorieVehiculeImpl _$$CategorieVehiculeImplFromJson(
  Map<String, dynamic> json,
) => _$CategorieVehiculeImpl(
  idCategorie: json['id_categorie'] as String,
  nom: json['nom'] as String,
  description: json['description'] as String?,
  actif: json['actif'] as bool? ?? true,
);

Map<String, dynamic> _$$CategorieVehiculeImplToJson(
  _$CategorieVehiculeImpl instance,
) => <String, dynamic>{
  'id_categorie': instance.idCategorie,
  'nom': instance.nom,
  'description': instance.description,
  'actif': instance.actif,
};
