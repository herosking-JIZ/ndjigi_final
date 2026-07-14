// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'location.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$LocationImpl _$$LocationImplFromJson(Map<String, dynamic> json) =>
    _$LocationImpl(
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      adresse: json['adresse'] as String?,
      nomLieu: json['nomLieu'] as String?,
      codePostal: json['codePostal'] as String?,
      ville: json['ville'] as String?,
      quartier: json['quartier'] as String?,
    );

Map<String, dynamic> _$$LocationImplToJson(_$LocationImpl instance) =>
    <String, dynamic>{
      'latitude': instance.latitude,
      'longitude': instance.longitude,
      'adresse': instance.adresse,
      'nomLieu': instance.nomLieu,
      'codePostal': instance.codePostal,
      'ville': instance.ville,
      'quartier': instance.quartier,
    };
