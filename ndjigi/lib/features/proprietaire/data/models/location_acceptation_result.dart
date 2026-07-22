// ── Résultat de PATCH /locations/:id/accepter ─────────────────────────
//
// Le paiement (débit locataire / crédit propriétaire net de commission)
// a lieu au moment de l'acceptation — voir locationController.accepter().

import '../../../../core/utils/json_parsers.dart';

class LocationAcceptationResult {
  final double? commission;
  final double? montantNet;
  final String? idConversation;

  const LocationAcceptationResult({this.commission, this.montantNet, this.idConversation});

  double? get montantTotal {
    if (commission == null || montantNet == null) return null;
    return commission! + montantNet!;
  }

  factory LocationAcceptationResult.fromJson(Map<String, dynamic> json) {
    return LocationAcceptationResult(
      commission: parseDoubleNullable(json['commission']),
      montantNet: parseDoubleNullable(json['montant_net']),
      idConversation: json['id_conversation'] as String?,
    );
  }
}
