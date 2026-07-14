// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notification.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$AppNotificationImpl _$$AppNotificationImplFromJson(
  Map<String, dynamic> json,
) => _$AppNotificationImpl(
  idNotification: json['id_notification'] as String,
  idUtilisateur: json['id_utilisateur'] as String,
  type: json['type'] as String,
  titre: json['titre'] as String,
  contenu: json['contenu'] as String,
  lu: json['lu'] as bool? ?? false,
  dateCreation: json['date_creation'] == null
      ? null
      : DateTime.parse(json['date_creation'] as String),
  dateLecture: json['date_lecture'] == null
      ? null
      : DateTime.parse(json['date_lecture'] as String),
  idObjetLie: json['id_objet_lie'] as String?,
);

Map<String, dynamic> _$$AppNotificationImplToJson(
  _$AppNotificationImpl instance,
) => <String, dynamic>{
  'id_notification': instance.idNotification,
  'id_utilisateur': instance.idUtilisateur,
  'type': instance.type,
  'titre': instance.titre,
  'contenu': instance.contenu,
  'lu': instance.lu,
  'date_creation': instance.dateCreation?.toIso8601String(),
  'date_lecture': instance.dateLecture?.toIso8601String(),
  'id_objet_lie': instance.idObjetLie,
};
