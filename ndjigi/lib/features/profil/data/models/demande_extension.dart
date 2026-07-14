// ignore_for_file: invalid_annotation_target
import 'package:freezed_annotation/freezed_annotation.dart';

part 'demande_extension.freezed.dart';
part 'demande_extension.g.dart';

// ── DemandeExtension (demande d'extension de profil) ──────────────────

@freezed
class DemandeExtension with _$DemandeExtension {
  const factory DemandeExtension({
    @JsonKey(name: 'id_demande_extension') required String idDemandeExtension,
    @JsonKey(name: 'id_utilisateur') required String idUtilisateur,
    @JsonKey(name: 'extension_type') required String extensionType,
    @Default('en_attente') String statut,
    @JsonKey(name: 'createdAt') DateTime? createdAt,
    @JsonKey(name: 'updatedAt') DateTime? updatedAt,
    @JsonKey(name: 'motif_rejet') String? motifRejet,
    @Default([]) List<DocumentRef> documents,
  }) = _DemandeExtension;

  factory DemandeExtension.fromJson(Map<String, dynamic> json) =>
      _$DemandeExtensionFromJson(json);
}

// ── DocumentRef (référence aux documents d'une demande) ───────────────

@freezed
class DocumentRef with _$DocumentRef {
  const factory DocumentRef({
    @JsonKey(name: 'id_document') required String idDocument,
    required String type,
    @Default('PENDING') String status,
  }) = _DocumentRef;

  factory DocumentRef.fromJson(Map<String, dynamic> json) =>
      _$DocumentRefFromJson(json);
}
