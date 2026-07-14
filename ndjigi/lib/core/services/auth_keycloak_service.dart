import 'dart:convert';
import 'package:dio/dio.dart';
import '../config/app_config.dart';
import '../storage/secure_storage.dart';
import '../../shared/models/utilisateur.dart';

class KeycloakAuthResult {
  final bool success;
  final String? accessToken;
  final String? refreshToken;
  final String? idToken;
  final Utilisateur? user;
  final String? errorMessage;
  final DateTime? expiresAt;

  KeycloakAuthResult({
    required this.success,
    this.accessToken,
    this.refreshToken,
    this.idToken,
    this.user,
    this.errorMessage,
    this.expiresAt,
  });
}

class KeycloakAuthService {
  final AppConfig _config;
  final SecureStorage _storage;
  final Dio _dio;

  static const String _keyIdToken = 'id_token';
  static const String _keyTokenExpiry = 'token_expiry';

  KeycloakAuthService({
    required AppConfig config,
    required SecureStorage storage,
    required Dio dio,
  })  : _config = config,
        _storage = storage,
        _dio = dio;

  /// Construit l'URL d'authentification Keycloak avec PKCE
  String buildAuthorizationUrl({
    required String codeChallenge,
    required String state,
  }) {
    final params = {
      'client_id': _config.keycloakClientId,
      'response_type': 'code',
      'redirect_uri': _config.redirectUri,
      'scope': 'openid profile email',
      'state': state,
      'code_challenge': codeChallenge,
      'code_challenge_method': 'S256',
    };

    final queryString = params.entries
        .map((e) => '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value)}')
        .join('&');

    return '${_config.keycloakAuthEndpoint}?$queryString';
  }

  /// Construit l'URL d'inscription Keycloak avec PKCE (même mécanisme que buildAuthorizationUrl)
  String buildRegistrationUrl({
    required String codeChallenge,
    required String state,
  }) {
    final params = {
      'client_id': _config.keycloakClientId,
      'response_type': 'code',
      'redirect_uri': _config.redirectUri,
      'scope': 'openid profile email phone',
      'state': state,
      'code_challenge': codeChallenge,
      'code_challenge_method': 'S256',
    };

    final queryString = params.entries
        .map((e) => '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value)}')
        .join('&');

    final registrationEndpoint = '${_config.keycloakUrl}/realms/${_config.keycloakRealm}/protocol/openid-connect/registrations';
    return '$registrationEndpoint?$queryString';
  }

  /// Échange le code authorization contre les tokens
  Future<KeycloakAuthResult> exchangeCodeForTokens({
    required String code,
    required String codeVerifier,
  }) async {
    try {
      final response = await _dio.post(
        _config.keycloakTokenEndpoint,
        data: {
          'grant_type': 'authorization_code',
          'client_id': _config.keycloakClientId,
          'code': code,
          'redirect_uri': _config.redirectUri,
          'code_verifier': codeVerifier,
        },
        options: Options(
          contentType: 'application/x-www-form-urlencoded',
        ),
      );

      if (response.statusCode != 200) {
        return KeycloakAuthResult(
          success: false,
          errorMessage: 'Erreur lors de l\'échange du code',
        );
      }

      final data = response.data as Map<String, dynamic>;
      final accessToken = data['access_token'] as String?;
      final refreshToken = data['refresh_token'] as String?;
      final idToken = data['id_token'] as String?;
      final expiresIn = data['expires_in'] as int?;

      if (accessToken == null) {
        return KeycloakAuthResult(
          success: false,
          errorMessage: 'Access token manquant',
        );
      }

      final expiresAt = expiresIn != null
          ? DateTime.now().add(Duration(seconds: expiresIn))
          : null;

      // Décoder l'id_token pour extraire les infos utilisateur
      final user = _decodeUserFromIdToken(idToken);

      // Sauvegarder les tokens
      await _storage.saveTokens(
        accessToken: accessToken,
        refreshToken: refreshToken ?? '',
      );
      if (idToken != null) {
        await _storage.save(_keyIdToken, idToken);
      }
      if (expiresAt != null) {
        await _storage.save(_keyTokenExpiry, expiresAt.toIso8601String());
      }

      return KeycloakAuthResult(
        success: true,
        accessToken: accessToken,
        refreshToken: refreshToken,
        idToken: idToken,
        user: user,
        expiresAt: expiresAt,
      );
    } on DioException catch (e) {
      return KeycloakAuthResult(
        success: false,
        errorMessage: 'Erreur d\'authentification: ${e.message}',
      );
    } catch (e) {
      return KeycloakAuthResult(
        success: false,
        errorMessage: 'Erreur d\'authentification: ${e.toString()}',
      );
    }
  }

  Future<bool> refreshAccessToken() async {
    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) return false;

      final response = await _dio.post(
        _config.keycloakTokenEndpoint,
        data: {
          'grant_type': 'refresh_token',
          'client_id': _config.keycloakClientId,
          'refresh_token': refreshToken,
        },
        options: Options(
          contentType: 'application/x-www-form-urlencoded',
          extra: {'skipRefresh': true},
        ),
      );

      if (response.statusCode != 200) return false;

      final data = response.data as Map<String, dynamic>;
      final accessToken = data['access_token'] as String?;
      final newRefreshToken = data['refresh_token'] as String?;
      final idToken = data['id_token'] as String?;
      final expiresIn = data['expires_in'] as int?;

      if (accessToken == null) return false;

      final expiresAt = expiresIn != null
          ? DateTime.now().add(Duration(seconds: expiresIn))
          : null;

      await _storage.saveTokens(
        accessToken: accessToken,
        refreshToken: newRefreshToken ?? refreshToken,
      );
      if (idToken != null) {
        await _storage.save(_keyIdToken, idToken);
      }
      if (expiresAt != null) {
        await _storage.save(_keyTokenExpiry, expiresAt.toIso8601String());
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  Future<void> logout() async {
    try {
      // La logique d'appel à end_session sera gérée par le repository
      // L'URL peut être ouverte dans un browser externe
    } catch (e) {
      // Continue logout même si l'API call échoue
    } finally {
      await _storage.clearTokens();
    }
  }

  /// Vérifie si le token a expiré
  Future<bool> isTokenExpired() async {
    try {
      final expiryStr = await _storage.read(_keyTokenExpiry);
      if (expiryStr == null) return true;

      final expiry = DateTime.parse(expiryStr);
      return DateTime.now().isAfter(expiry);
    } catch (e) {
      return true;
    }
  }

  Utilisateur? _decodeUserFromIdToken(String? idToken) {
    if (idToken == null) return null;

    try {
      final parts = idToken.split('.');
      if (parts.length != 3) return null;

      // Décoder le payload (2ème partie)
      String normalized = parts[1];
      // Ajouter le padding si nécessaire
      final paddingNeeded = 4 - (normalized.length % 4);
      if (paddingNeeded < 4) {
        normalized += '=' * paddingNeeded;
      }

      final decoded = utf8.decode(base64.decode(normalized));
      final json = jsonDecode(decoded) as Map<String, dynamic>;

      // Construire l'objet Utilisateur à partir du JWT
      return Utilisateur(
        idUtilisateur: json['sub'] as String? ?? '',
        email: json['email'] as String? ?? '',
        prenom: json['given_name'] as String?,
        nom: json['family_name'] as String?,
        numeroTelephone: json['phone_number'] as String?,
        roles: _extractRoles(json),
        statutCompte: 'actif',
      );
    } catch (e) {
      return null;
    }
  }

  List<String> _extractRoles(Map<String, dynamic> jwt) {
    try {
      // Keycloak stocke les roles dans 'realm_access.roles'
      final realmAccess = jwt['realm_access'] as Map<String, dynamic>?;
      if (realmAccess != null) {
        final roles = realmAccess['roles'] as List<dynamic>?;
        if (roles != null) {
          return roles
              .whereType<String>()
              .where((r) => !r.startsWith('default-'))
              .toList();
        }
      }

      // Fallback: chercher dans 'roles' direct
      final directRoles = jwt['roles'] as List<dynamic>?;
      if (directRoles != null) {
        return directRoles.whereType<String>().toList();
      }

      return ['passager']; // Rôle par défaut
    } catch (e) {
      return ['passager'];
    }
  }
}
