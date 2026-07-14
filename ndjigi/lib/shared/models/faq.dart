// ignore_for_file: invalid_annotation_target
import 'package:freezed_annotation/freezed_annotation.dart';

part 'faq.freezed.dart';
part 'faq.g.dart';

@freezed
class Faq with _$Faq {
  const factory Faq({
    @JsonKey(name: 'id_faq') required String idFaq,
    required String question,
    required String reponse,
    String? categorie,
    @Default(0) int ordre,
    @Default(true) bool isActive,
    @Default(0) int helpfulCount,
    @Default(0) int notHelpfulCount,
    @Default(0) int viewCount,
    @JsonKey(name: 'createdAt') DateTime? createdAt,
    @JsonKey(name: 'updatedAt') DateTime? updatedAt,
  }) = _Faq;

  factory Faq.fromJson(Map<String, dynamic> json) => _$FaqFromJson(json);
}
