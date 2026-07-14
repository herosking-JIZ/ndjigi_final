import 'package:freezed_annotation/freezed_annotation.dart';
import '../../../shared/models/utilisateur.dart';

part 'auth_result.freezed.dart';

@freezed
class AuthResult with _$AuthResult {
  const factory AuthResult({
    required bool success,
    String? accessToken,
    String? refreshToken,
    Utilisateur? user,
    String? errorMessage,
    int? statusCode,
    String? errorCode,
    String? accessTokenPending,
    Map<String, dynamic>? keycloakData,
  }) = _AuthResult;
}
