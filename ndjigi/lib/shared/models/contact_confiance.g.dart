// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'contact_confiance.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ContactConfianceImpl _$$ContactConfianceImplFromJson(
  Map<String, dynamic> json,
) => _$ContactConfianceImpl(
  idContact: json['id_contact'] as String,
  idUtilisateur: json['id_user'] as String,
  nom: json['nom'] as String,
  prenom: json['prenom'] as String,
  countryCode: json['country_code'] as String,
  phone: json['phone'] as String,
  relation: json['relation'] as String,
  createdAt: json['createdAt'] == null
      ? null
      : DateTime.parse(json['createdAt'] as String),
  updatedAt: json['updatedAt'] == null
      ? null
      : DateTime.parse(json['updatedAt'] as String),
);

Map<String, dynamic> _$$ContactConfianceImplToJson(
  _$ContactConfianceImpl instance,
) => <String, dynamic>{
  'id_contact': instance.idContact,
  'id_user': instance.idUtilisateur,
  'nom': instance.nom,
  'prenom': instance.prenom,
  'country_code': instance.countryCode,
  'phone': instance.phone,
  'relation': instance.relation,
  'createdAt': instance.createdAt?.toIso8601String(),
  'updatedAt': instance.updatedAt?.toIso8601String(),
};
