// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'support_ticket.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$SupportTicketImpl _$$SupportTicketImplFromJson(Map<String, dynamic> json) =>
    _$SupportTicketImpl(
      idTicket: json['id_ticket'] as String,
      sujet: json['sujet'] as String,
      description: json['description'] as String,
      idUtilisateur: json['id_utilisateur'] as String?,
      idTrajet: json['id_trajet'] as String?,
      idPaiement: json['id_paiement'] as String?,
      idLocation: json['id_location'] as String?,
      statut: json['statut'] as String? ?? 'ouvert',
      eligibleRemboursement: json['eligible_remboursement'] as bool? ?? false,
      dateCreation: json['date_creation'] == null
          ? null
          : DateTime.parse(json['date_creation'] as String),
      dateResolution: json['date_resolution'] == null
          ? null
          : DateTime.parse(json['date_resolution'] as String),
    );

Map<String, dynamic> _$$SupportTicketImplToJson(_$SupportTicketImpl instance) =>
    <String, dynamic>{
      'id_ticket': instance.idTicket,
      'sujet': instance.sujet,
      'description': instance.description,
      'id_utilisateur': instance.idUtilisateur,
      'id_trajet': instance.idTrajet,
      'id_paiement': instance.idPaiement,
      'id_location': instance.idLocation,
      'statut': instance.statut,
      'eligible_remboursement': instance.eligibleRemboursement,
      'date_creation': instance.dateCreation?.toIso8601String(),
      'date_resolution': instance.dateResolution?.toIso8601String(),
    };
