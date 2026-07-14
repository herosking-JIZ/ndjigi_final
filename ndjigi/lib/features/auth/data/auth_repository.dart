import 'dart:convert';
import 'dart:math';
import 'package:crypto/crypto.dart';
import 'package:dio/dio.dart';
import '../../../core/network/api_service.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../core/services/auth_keycloak_service.dart';
import '../../../shared/models/utilisateur.dart';
import 'auth_result.dart';

class AuthRepository {
  final ApiService _apiService;
  final SecureStorage _storage;
  final KeycloakAuthService _keycloakService;

  AuthRepository({
    required ApiService apiService,
    required SecureStorage storage,
    required KeycloakAuthService keycloakService,
  })  : _apiService = apiService,
        _storage = storage,
        _keycloakService = keycloakService;

  Future<AuthResult> login(String email, String password) async {
    try {
      final response = await _apiService.post<Map<String, dynamic>>(
        '/auth/login',
        data: {
          'email': email,
          'password': password,
          'grant_type': 'password',
        },
      );

      final accessToken = response['access_token'] as String?;
      final refreshToken = response['refresh_token'] as String?;
      final userData = response['user'] as Map<String, dynamic>?;

      if (accessToken != null && refreshToken != null && userData != null) {
        final user = Utilisateur.fromJson(userData);
        await _storage.saveTokens(
          accessToken: accessToken,
          refreshToken: refreshToken,
        );
        await _storage.saveUserId(user.idUtilisateur);

        return AuthResult(
          success: true,
          accessToken: accessToken,
          refreshToken: refreshToken,
          user: user,
        );
      }

      return const AuthResult(
        success: false,
        errorMessage: 'Réponse API invalide',
      );
    } catch (e) {
      return AuthResult(
        success: false,
        errorMessage: _handleError(e),
      );
    }
  }

  Future<void> logout() async {
    try {
      final accessToken = await _storage.getAccessToken();
      final refreshToken = await _storage.getRefreshToken();

      if (accessToken != null && refreshToken != null) {
        await _apiService.post(
          '/auth/logout',
          data: {'refresh_token': refreshToken},
        );
      }
    } catch (e) {
      // Continue logout even if API call fails
    } finally {
      await _storage.clearTokens();
    }
  }

  Future<Utilisateur?> getProfile() async {
    try {
      final response = await _apiService.get<Map<String, dynamic>>(
        '/utilisateur/profil',
      );

      return Utilisateur.fromJson(response);
    } catch (e) {
      return null;
    }
  }

  Future<Utilisateur?> updateProfile({
    String? prenom,
    String? nom,
    String? numeroTelephone,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (prenom != null) data['prenom'] = prenom;
      if (nom != null) data['nom'] = nom;
      if (numeroTelephone != null) data['numero_telephone'] = numeroTelephone;

      final response = await _apiService.patch<Map<String, dynamic>>(
        '/utilisateur/profil',
        data: data,
      );

      final userMap = response['user'] as Map<String, dynamic>?;
      if (userMap != null) {
        return Utilisateur.fromJson(userMap);
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  Future<bool> refreshTokens() async {
    try {
      // Utiliser Keycloak pour le refresh
      return await _keycloakService.refreshAccessToken();
    } catch (e) {
      await _storage.clearTokens();
      return false;
    }
  }

  Future<bool> isAuthenticated() async {
    final token = await _storage.getAccessToken();
    if (token == null || token.isEmpty) return false;

    // Vérifier si le token a expiré
    final isExpired = await _keycloakService.isTokenExpired();
    if (isExpired) {
      // Essayer de rafraîchir automatiquement
      await refreshTokens();
      // Vérifier si le refresh a réussi
      final newToken = await _storage.getAccessToken();
      return newToken != null && newToken.isNotEmpty;
    }

    return true;
  }

  /// Synchronise les données utilisateur avec le backend après Keycloak
  /// Récupère statut_compte et données métier de PostgreSQL
  /// Transforme utilisateur_role en roles
  Future<AuthResult> syncUser(String accessToken) async {
    try {
      // Récupérer le refreshToken existant (sauvegardé lors du login Keycloak)
      final existingRefreshToken = await _storage.getRefreshToken() ?? '';

      // Sauvegarder le token avant l'appel (garder le refreshToken existant)
      await _storage.saveTokens(
        accessToken: accessToken,
        refreshToken: existingRefreshToken,
      );

      final response = await _apiService.post<Map<String, dynamic>>(
        '/users/sync',
        options: Options(headers: {'Authorization': 'Bearer $accessToken'}),
      );

      final userData = response['data'] as Map<String, dynamic>?;
      if (userData != null) {
        final user = Utilisateur.fromJson(userData);
        await _storage.saveUserId(user.idUtilisateur);

        return AuthResult(
          success: true,
          accessToken: accessToken,
          user: user,
        );
      }

      return const AuthResult(
        success: false,
        errorMessage: 'Données utilisateur manquantes',
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 422) {
        final data = e.response?.data as Map<String, dynamic>?;
        if (data?['code'] == 'PHONE_NUMBER_REQUIRED') {
          return AuthResult(
            success: false,
            errorCode: 'PHONE_NUMBER_REQUIRED',
            accessTokenPending: accessToken,
            keycloakData: data?['keycloak_data'] as Map<String, dynamic>?,
          );
        }
      }
      return AuthResult(
        success: false,
        errorMessage: _handleError(e),
      );
    } catch (e) {
      return AuthResult(
        success: false,
        errorMessage: _handleError(e),
      );
    }
  }

  /// Complète la synchronisation avec le numéro de téléphone
  Future<AuthResult> syncUserWithPhone({
    required String accessToken,
    required String numeroTelephone,
  }) async {
    try {
      // Récupérer le refreshToken existant (sauvegardé lors du login Keycloak)
      final existingRefreshToken = await _storage.getRefreshToken() ?? '';

      await _storage.saveTokens(
        accessToken: accessToken,
        refreshToken: existingRefreshToken,
      );

      final response = await _apiService.post<Map<String, dynamic>>(
        '/users/sync',
        data: {'numero_telephone': numeroTelephone},
        options: Options(headers: {'Authorization': 'Bearer $accessToken'}),
      );

      final userData = response['data'] as Map<String, dynamic>?;
      if (userData != null) {
        final user = Utilisateur.fromJson(userData);
        await _storage.saveUserId(user.idUtilisateur);

        return AuthResult(
          success: true,
          accessToken: accessToken,
          user: user,
        );
      }

      return const AuthResult(
        success: false,
        errorMessage: 'Données utilisateur manquantes',
      );
    } catch (e) {
      return AuthResult(
        success: false,
        errorMessage: _handleError(e),
      );
    }
  }

  /// Démarre le flux de login Keycloak PKCE
  /// Retourne l'URL d'authentification et les valeurs PKCE
  Map<String, String> startLoginWithKeycloak() {
    final codeVerifier = _generateCodeVerifier();
    final codeChallenge = _generateCodeChallenge(codeVerifier);
    final state = _generateRandomString(32);

    final authUrl = _keycloakService.buildAuthorizationUrl(
      codeChallenge: codeChallenge,
      state: state,
    );

    // Stocker temporairement le verifier et state en mémoire (pas critique)
    return {
      'authUrl': authUrl,
      'codeVerifier': codeVerifier,
      'state': state,
    };
  }

  /// Démarre le flux d'inscription Keycloak PKCE
  /// Retourne l'URL d'inscription et les valeurs PKCE
  Map<String, String> startRegisterWithKeycloak() {
    final codeVerifier = _generateCodeVerifier();
    final codeChallenge = _generateCodeChallenge(codeVerifier);
    final state = _generateRandomString(32);

    final registerUrl = _keycloakService.buildRegistrationUrl(
      codeChallenge: codeChallenge,
      state: state,
    );

    return {
      'authUrl': registerUrl,
      'codeVerifier': codeVerifier,
      'state': state,
    };
  }

  /// Complète le flux de login avec le code reçu du callback
  Future<AuthResult> completeLoginWithKeycloak({
    required String code,
    required String codeVerifier,
  }) async {
    try {
      final result = await _keycloakService.exchangeCodeForTokens(
        code: code,
        codeVerifier: codeVerifier,
      );

      if (result.success && result.user != null) {
        await _storage.saveUserId(result.user!.idUtilisateur);

        return AuthResult(
          success: true,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user,
        );
      }

      return AuthResult(
        success: false,
        errorMessage: result.errorMessage ?? 'Erreur d\'authentification Keycloak',
      );
    } catch (e) {
      return AuthResult(
        success: false,
        errorMessage: _handleError(e),
      );
    }
  }

  String _handleError(dynamic error) {
    return 'Une erreur est survenue. Veuillez réessayer.';
  }

  /// Générateur PKCE - code_verifier aléatoire (43-128 chars, URL-safe base64)
  static String _generateCodeVerifier() {
    const charset =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    final random = Random.secure();
    return List.generate(128, (_) => charset[random.nextInt(charset.length)])
        .join();
  }

  /// Génère le code_challenge = BASE64URL(SHA256(code_verifier))
  static String _generateCodeChallenge(String codeVerifier) {
    final bytes = utf8.encode(codeVerifier);
    final digest = sha256.convert(bytes);

    // Base64url encode
    final base64 = base64Url.encode(digest.bytes);
    // Enlever le padding '='
    return base64.replaceAll('=', '');
  }

  static String _generateRandomString(int length) {
    const charset =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    final random = Random.secure();
    return List.generate(length, (_) => charset[random.nextInt(charset.length)])
        .join();
  }
}
