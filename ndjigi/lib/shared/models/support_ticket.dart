// ignore_for_file: invalid_annotation_target
import 'package:freezed_annotation/freezed_annotation.dart';

part 'support_ticket.freezed.dart';
part 'support_ticket.g.dart';

@freezed
class SupportTicket with _$SupportTicket {
  const factory SupportTicket({
    @JsonKey(name: 'id_ticket') required String idTicket,
    required String sujet,
    required String description,
    @JsonKey(name: 'id_utilisateur') String? idUtilisateur,
    @JsonKey(name: 'id_trajet') String? idTrajet,
    @JsonKey(name: 'id_paiement') String? idPaiement,
    @JsonKey(name: 'id_location') String? idLocation,
    @Default('ouvert') String statut,
    @JsonKey(name: 'eligible_remboursement') @Default(false) bool eligibleRemboursement,
    @JsonKey(name: 'date_creation') DateTime? dateCreation,
    @JsonKey(name: 'date_resolution') DateTime? dateResolution,
  }) = _SupportTicket;

  factory SupportTicket.fromJson(Map<String, dynamic> json) => _$SupportTicketFromJson(json);
}
