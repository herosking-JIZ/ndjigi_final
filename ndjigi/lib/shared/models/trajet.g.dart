// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'trajet.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$TrajetImpl _$$TrajetImplFromJson(Map<String, dynamic> json) => _$TrajetImpl(
  id: json['id'] as String,
  passagerId: json['passagerId'] as String,
  chauffeurId: json['chauffeurId'] as String?,
  depart: Location.fromJson(json['depart'] as Map<String, dynamic>),
  arrivee: Location.fromJson(json['arrivee'] as Map<String, dynamic>),
  statut: json['statut'] as String,
  distanceKm: json['distanceKm'] as String?,
  dureeMinutes: json['dureeMinutes'] as String?,
  tarifEstime: json['tarifEstime'] as String?,
  tarifFinal: json['tarifFinal'] as String?,
  dateCreation: json['dateCreation'] == null
      ? null
      : DateTime.parse(json['dateCreation'] as String),
  dateDebut: json['dateDebut'] == null
      ? null
      : DateTime.parse(json['dateDebut'] as String),
  dateFin: json['dateFin'] == null
      ? null
      : DateTime.parse(json['dateFin'] as String),
);

Map<String, dynamic> _$$TrajetImplToJson(_$TrajetImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'passagerId': instance.passagerId,
      'chauffeurId': instance.chauffeurId,
      'depart': instance.depart,
      'arrivee': instance.arrivee,
      'statut': instance.statut,
      'distanceKm': instance.distanceKm,
      'dureeMinutes': instance.dureeMinutes,
      'tarifEstime': instance.tarifEstime,
      'tarifFinal': instance.tarifFinal,
      'dateCreation': instance.dateCreation?.toIso8601String(),
      'dateDebut': instance.dateDebut?.toIso8601String(),
      'dateFin': instance.dateFin?.toIso8601String(),
    };
