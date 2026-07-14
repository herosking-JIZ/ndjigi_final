// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'utilisateur.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$UtilisateurImpl _$$UtilisateurImplFromJson(Map<String, dynamic> json) =>
    _$UtilisateurImpl(
      idUtilisateur: json['id_utilisateur'] as String,
      email: json['email'] as String,
      prenom: json['prenom'] as String?,
      nom: json['nom'] as String?,
      numeroTelephone: json['numero_telephone'] as String?,
      photoProfil: json['photo_profil'] as String?,
      adresse: json['adresse'] as String?,
      roles:
          (json['roles'] as List<dynamic>?)?.map((e) => e as String).toList() ??
          const [],
      statutCompte: json['statut_compte'] as String? ?? 'actif',
      deuxFaActivee: json['deux_fa_activee'] as bool? ?? false,
    );

Map<String, dynamic> _$$UtilisateurImplToJson(_$UtilisateurImpl instance) =>
    <String, dynamic>{
      'id_utilisateur': instance.idUtilisateur,
      'email': instance.email,
      'prenom': instance.prenom,
      'nom': instance.nom,
      'numero_telephone': instance.numeroTelephone,
      'photo_profil': instance.photoProfil,
      'adresse': instance.adresse,
      'roles': instance.roles,
      'statut_compte': instance.statutCompte,
      'deux_fa_activee': instance.deuxFaActivee,
    };
