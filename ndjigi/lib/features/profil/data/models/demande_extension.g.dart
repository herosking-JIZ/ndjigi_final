// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'demande_extension.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$DemandeExtensionImpl _$$DemandeExtensionImplFromJson(
  Map<String, dynamic> json,
) => _$DemandeExtensionImpl(
  idDemandeExtension: json['id_demande_extension'] as String,
  idUtilisateur: json['id_utilisateur'] as String,
  extensionType: json['extension_type'] as String,
  statut: json['statut'] as String? ?? 'en_attente',
  createdAt: json['createdAt'] == null
      ? null
      : DateTime.parse(json['createdAt'] as String),
  updatedAt: json['updatedAt'] == null
      ? null
      : DateTime.parse(json['updatedAt'] as String),
  motifRejet: json['motif_rejet'] as String?,
  documents:
      (json['documents'] as List<dynamic>?)
          ?.map((e) => DocumentRef.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
);

Map<String, dynamic> _$$DemandeExtensionImplToJson(
  _$DemandeExtensionImpl instance,
) => <String, dynamic>{
  'id_demande_extension': instance.idDemandeExtension,
  'id_utilisateur': instance.idUtilisateur,
  'extension_type': instance.extensionType,
  'statut': instance.statut,
  'createdAt': instance.createdAt?.toIso8601String(),
  'updatedAt': instance.updatedAt?.toIso8601String(),
  'motif_rejet': instance.motifRejet,
  'documents': instance.documents,
};

_$DocumentRefImpl _$$DocumentRefImplFromJson(Map<String, dynamic> json) =>
    _$DocumentRefImpl(
      idDocument: json['id_document'] as String,
      type: json['type'] as String,
      status: json['status'] as String? ?? 'PENDING',
    );

Map<String, dynamic> _$$DocumentRefImplToJson(_$DocumentRefImpl instance) =>
    <String, dynamic>{
      'id_document': instance.idDocument,
      'type': instance.type,
      'status': instance.status,
    };
