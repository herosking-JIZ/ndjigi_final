import 'package:freezed_annotation/freezed_annotation.dart';
import 'location.dart';

part 'trajet.freezed.dart';
part 'trajet.g.dart';

@freezed
class Trajet with _$Trajet {
  const factory Trajet({
    required String id,
    required String passagerId,
    required String? chauffeurId,
    required Location depart,
    required Location arrivee,
    required String statut,
    String? distanceKm,
    String? dureeMinutes,
    String? tarifEstime,
    String? tarifFinal,
    DateTime? dateCreation,
    DateTime? dateDebut,
    DateTime? dateFin,
  }) = _Trajet;

  factory Trajet.fromJson(Map<String, dynamic> json) => _$TrajetFromJson(json);
}
