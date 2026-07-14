// ignore_for_file: invalid_annotation_target
import 'package:freezed_annotation/freezed_annotation.dart';

part 'portefeuille.freezed.dart';
part 'portefeuille.g.dart';

double _soldeFromJson(dynamic value) {
  if (value == null) return 0.0;
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0.0;
  return 0.0;
}

double? _detteFromJson(dynamic value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}

@freezed
class Portefeuille with _$Portefeuille {
  const factory Portefeuille({
    @JsonKey(name: 'id_portefeuille') required String idPortefeuille,
    @JsonKey(name: 'id_utilisateur') required String idUtilisateur,
    @JsonKey(name: 'solde', fromJson: _soldeFromJson) required double solde,
    @JsonKey(name: 'dette_commission', fromJson: _detteFromJson) double? detteCommission,
    @Default('XOF') String devise,
    @Default('actif') String statut,
  }) = _Portefeuille;

  factory Portefeuille.fromJson(Map<String, dynamic> json) => _$PortefeuilleFromJson(json);
}
