// ignore_for_file: invalid_annotation_target
import 'package:freezed_annotation/freezed_annotation.dart';

part 'notification.freezed.dart';
part 'notification.g.dart';

// ── AppNotification ─────────────────────────────────────────────────

@freezed
class AppNotification with _$AppNotification {
  const factory AppNotification({
    @JsonKey(name: 'id_notification') required String idNotification,
    @JsonKey(name: 'id_utilisateur') required String idUtilisateur,
    required String type,
    required String titre,
    required String contenu,
    @Default(false) bool lu,
    @JsonKey(name: 'date_creation') DateTime? dateCreation,
    @JsonKey(name: 'date_lecture') DateTime? dateLecture,
    @JsonKey(name: 'id_objet_lie') String? idObjetLie,
  }) = _AppNotification;

  factory AppNotification.fromJson(Map<String, dynamic> json) =>
      _$AppNotificationFromJson(json);
}
