// ignore_for_file: invalid_annotation_target
import 'package:freezed_annotation/freezed_annotation.dart';

part 'contact_confiance.freezed.dart';
part 'contact_confiance.g.dart';

@freezed
class ContactConfiance with _$ContactConfiance {
  const factory ContactConfiance({
    @JsonKey(name: 'id_contact') required String idContact,
    @JsonKey(name: 'id_user') required String idUtilisateur,
    required String nom,
    required String prenom,
    @JsonKey(name: 'country_code') required String countryCode,
    required String phone,
    required String relation,
    @JsonKey(name: 'createdAt') DateTime? createdAt,
    @JsonKey(name: 'updatedAt') DateTime? updatedAt,
  }) = _ContactConfiance;

  factory ContactConfiance.fromJson(Map<String, dynamic> json) => _$ContactConfianceFromJson(json);
}
