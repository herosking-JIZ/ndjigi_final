// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'portefeuille.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$PortefeuilleImpl _$$PortefeuilleImplFromJson(Map<String, dynamic> json) =>
    _$PortefeuilleImpl(
      idPortefeuille: json['id_portefeuille'] as String,
      idUtilisateur: json['id_utilisateur'] as String,
      solde: _soldeFromJson(json['solde']),
      detteCommission: _detteFromJson(json['dette_commission']),
      devise: json['devise'] as String? ?? 'XOF',
      statut: json['statut'] as String? ?? 'actif',
    );

Map<String, dynamic> _$$PortefeuilleImplToJson(_$PortefeuilleImpl instance) =>
    <String, dynamic>{
      'id_portefeuille': instance.idPortefeuille,
      'id_utilisateur': instance.idUtilisateur,
      'solde': instance.solde,
      'dette_commission': instance.detteCommission,
      'devise': instance.devise,
      'statut': instance.statut,
    };
