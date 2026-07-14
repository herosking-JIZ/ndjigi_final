// ignore_for_file: invalid_annotation_target
import 'package:freezed_annotation/freezed_annotation.dart';

part 'utilisateur.freezed.dart';
part 'utilisateur.g.dart';

@freezed
class Utilisateur with _$Utilisateur {
  const factory Utilisateur({
    @JsonKey(name: 'id_utilisateur') required String idUtilisateur,
    required String email,
    String? prenom,
    String? nom,
    @JsonKey(name: 'numero_telephone') String? numeroTelephone,
    @JsonKey(name: 'photo_profil') String? photoProfil,
    @JsonKey(name: 'adresse') String? adresse,
    @Default([]) List<String> roles,
    @JsonKey(name: 'statut_compte') @Default('actif') String statutCompte,
    @JsonKey(name: 'deux_fa_activee') @Default(false) bool deuxFaActivee,
  }) = _Utilisateur;

  factory Utilisateur.fromJson(Map<String, dynamic> json) => _$UtilisateurFromJson(json);
}
