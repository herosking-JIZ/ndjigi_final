// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'faq.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$FaqImpl _$$FaqImplFromJson(Map<String, dynamic> json) => _$FaqImpl(
  idFaq: json['id_faq'] as String,
  question: json['question'] as String,
  reponse: json['reponse'] as String,
  categorie: json['categorie'] as String?,
  ordre: (json['ordre'] as num?)?.toInt() ?? 0,
  isActive: json['isActive'] as bool? ?? true,
  helpfulCount: (json['helpfulCount'] as num?)?.toInt() ?? 0,
  notHelpfulCount: (json['notHelpfulCount'] as num?)?.toInt() ?? 0,
  viewCount: (json['viewCount'] as num?)?.toInt() ?? 0,
  createdAt: json['createdAt'] == null
      ? null
      : DateTime.parse(json['createdAt'] as String),
  updatedAt: json['updatedAt'] == null
      ? null
      : DateTime.parse(json['updatedAt'] as String),
);

Map<String, dynamic> _$$FaqImplToJson(_$FaqImpl instance) => <String, dynamic>{
  'id_faq': instance.idFaq,
  'question': instance.question,
  'reponse': instance.reponse,
  'categorie': instance.categorie,
  'ordre': instance.ordre,
  'isActive': instance.isActive,
  'helpfulCount': instance.helpfulCount,
  'notHelpfulCount': instance.notHelpfulCount,
  'viewCount': instance.viewCount,
  'createdAt': instance.createdAt?.toIso8601String(),
  'updatedAt': instance.updatedAt?.toIso8601String(),
};
