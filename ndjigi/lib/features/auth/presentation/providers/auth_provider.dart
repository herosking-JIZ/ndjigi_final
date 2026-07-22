import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/app_providers.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../../shared/models/utilisateur.dart';
import '../../data/auth_repository.dart';

class LoginFlowState {
  final String? authUrl;
  final String? codeVerifier;
  final String? state;

  LoginFlowState({this.authUrl, this.codeVerifier, this.state});
}

class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final Utilisateur? user;
  final String? activeRole;
  final List<String> availableRoles;
  final String? errorMessage;
  final bool phoneRequired;
  final String? pendingAccessToken;
  final Map<String, dynamic>? pendingKeycloakData;

  AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.user,
    this.activeRole,
    this.availableRoles = const [],
    this.errorMessage,
    this.phoneRequired = false,
    this.pendingAccessToken,
    this.pendingKeycloakData,
  });

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    Utilisateur? user,
    String? activeRole,
    List<String>? availableRoles,
    String? errorMessage,
    bool? phoneRequired,
    String? pendingAccessToken,
    Map<String, dynamic>? pendingKeycloakData,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: user ?? this.user,
      activeRole: activeRole ?? this.activeRole,
      availableRoles: availableRoles ?? this.availableRoles,
      errorMessage: errorMessage ?? this.errorMessage,
      phoneRequired: phoneRequired ?? this.phoneRequired,
      pendingAccessToken: pendingAccessToken ?? this.pendingAccessToken,
      pendingKeycloakData: pendingKeycloakData ?? this.pendingKeycloakData,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _authRepository;
  final SecureStorage _storage;

  AuthNotifier({
    required AuthRepository authRepository,
    required SecureStorage storage,
  }) : _authRepository = authRepository,
       _storage = storage,
       super(AuthState());

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    final result = await _authRepository.login(email, password);

    if (result.success && result.user != null) {
      final activeRole = result.user!.roles.isNotEmpty
          ? result.user!.roles.first
          : 'passager';
      await _storage.saveActiveRole(activeRole);

      state = state.copyWith(
        isLoading: false,
        isAuthenticated: true,
        user: result.user,
        activeRole: activeRole,
        availableRoles: result.user!.roles,
      );
    } else {
      state = state.copyWith(
        isLoading: false,
        errorMessage: result.errorMessage ?? 'Erreur de connexion',
      );
    }
  }

  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    await _authRepository.logout();
    await _storage.clearAll();

    state = AuthState();
  }

  Future<void> checkAuthStatus() async {
    state = state.copyWith(isLoading: true);

    try {
      final isAuth = await _authRepository.isAuthenticated();

      if (isAuth) {
        final accessToken = await _storage.getAccessToken();

        if (accessToken != null) {
          // Ajouter un timeout pour éviter les blocages réseau
          final syncResult = await _authRepository
              .syncUser(accessToken)
              .timeout(const Duration(seconds: 8));

          if (syncResult.success && syncResult.user != null) {
            final activeRole =
                await _storage.getActiveRole() ??
                (syncResult.user!.roles.isNotEmpty
                    ? syncResult.user!.roles.first
                    : 'passager');
            await _storage.saveActiveRole(activeRole);

            state = state.copyWith(
              isLoading: false,
              isAuthenticated: true,
              user: syncResult.user,
              activeRole: activeRole,
              availableRoles: syncResult.user!.roles,
            );
            return;
          }
        }
      }

      state = state.copyWith(isLoading: false, isAuthenticated: false);
    } catch (e) {
      if (e is TimeoutException) {
        // Ne pas supprimer le token sur timeout réseau
        // L'utilisateur reste logué mais on ne peut pas charger le profil
        state = state.copyWith(isLoading: false, isAuthenticated: true);
        return;
      }
      state = state.copyWith(isLoading: false, isAuthenticated: false);
    }
  }

  /// Resynchronise le profil sans modifier la session en cas d'erreur réseau.
  Future<void> refreshProfile() async {
    final accessToken = await _storage.getAccessToken();
    if (accessToken == null) {
      throw StateError('Session introuvable.');
    }

    final result = await _authRepository
        .syncUser(accessToken)
        .timeout(const Duration(seconds: 8));
    if (!result.success || result.user == null) {
      throw StateError(
        result.errorMessage ?? 'Impossible d’actualiser le profil.',
      );
    }

    state = state.copyWith(
      user: result.user,
      availableRoles: result.user!.roles,
    );
  }

  /// Met à jour immédiatement le profil renvoyé par une mutation authentifiée.
  void replaceUser(Utilisateur user) {
    state = state.copyWith(
      user: user,
      availableRoles: user.roles.isEmpty ? state.availableRoles : user.roles,
    );
  }

  Future<void> switchRole(String role) async {
    if (state.user != null && state.user!.roles.contains(role)) {
      await _storage.saveActiveRole(role);
      state = state.copyWith(activeRole: role);
    }
  }

  Future<LoginFlowState?> startKeycloakLogin() async {
    try {
      final loginData = _authRepository.startLoginWithKeycloak();
      final codeVerifier = loginData['codeVerifier'];

      if (codeVerifier == null || codeVerifier.isEmpty) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: 'Erreur: code verifier manquant',
        );
        return null;
      }

      // ✅ Sauvegarder le verifier en SecureStorage (survit à la recréation d'activité Android)
      await _storage.saveCodeVerifier(codeVerifier);
      print(
        '🔵 NDJIGI-AUTH: [AUTH-PROVIDER] startKeycloakLogin: verifier SAUVEGARDÉ = ${codeVerifier.substring(0, 8)}...',
      );

      return LoginFlowState(
        authUrl: loginData['authUrl'],
        codeVerifier: codeVerifier,
        state: loginData['state'],
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Erreur lors du démarrage de la connexion',
      );
      return null;
    }
  }

  Future<LoginFlowState?> startKeycloakRegister() async {
    try {
      final registerData = _authRepository.startRegisterWithKeycloak();
      final codeVerifier = registerData['codeVerifier'];

      if (codeVerifier == null || codeVerifier.isEmpty) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: 'Erreur: code verifier manquant',
        );
        return null;
      }

      await _storage.saveCodeVerifier(codeVerifier);
      print(
        '🔵 NDJIGI-AUTH: [AUTH-PROVIDER] startKeycloakRegister: verifier SAUVEGARDÉ = ${codeVerifier.substring(0, 8)}...',
      );

      return LoginFlowState(
        authUrl: registerData['authUrl'],
        codeVerifier: codeVerifier,
        state: registerData['state'],
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Erreur lors du démarrage de l\'inscription',
      );
      return null;
    }
  }

  Future<void> completeKeycloakLogin({
    required String code,
    String? codeVerifier,
  }) async {
    print(
      '🔵 NDJIGI-AUTH: [AUTH-PROVIDER] completeKeycloakLogin DÉBUT, code reçu = $code',
    );
    state = state.copyWith(isLoading: true, errorMessage: null);

    // ✅ Lire le code_verifier depuis SecureStorage (survit à la recréation d'activité)
    String? verifier = codeVerifier;

    if (verifier == null || verifier.isEmpty) {
      verifier = await _storage.getCodeVerifier();
    }
    print(
      '🔵 NDJIGI-AUTH: [AUTH-PROVIDER] verifier LU = ${verifier == null ? "NULL" : "${verifier.substring(0, 8)}..."}',
    );

    if (verifier == null || verifier.isEmpty) {
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
        errorMessage: 'Session expirée. Recommencez la connexion.',
      );
      return;
    }

    // 1️⃣ Échanger le code Keycloak contre les tokens
    final keycloakResult = await _authRepository.completeLoginWithKeycloak(
      code: code,
      codeVerifier: verifier,
    );
    print(
      '🔵 NDJIGI-AUTH: [AUTH-PROVIDER] échange token success = ${keycloakResult.success}, erreur = ${keycloakResult.errorMessage}',
    );

    if (!keycloakResult.success || keycloakResult.accessToken == null) {
      state = state.copyWith(
        isLoading: false,
        errorMessage:
            keycloakResult.errorMessage ?? 'Erreur de connexion Keycloak',
      );
      return;
    }

    // 2️⃣ Synchroniser les données avec le backend pour obtenir statut_compte et données métier
    try {
      final syncResult = await _authRepository.syncUser(
        keycloakResult.accessToken!,
      );
      print(
        '🔵 NDJIGI-AUTH: [AUTH-PROVIDER] sync success = ${syncResult.success}, erreur = ${syncResult.errorMessage}',
      );

      if (syncResult.errorCode == 'PHONE_NUMBER_REQUIRED') {
        state = state.copyWith(
          isLoading: false,
          phoneRequired: true,
          pendingAccessToken: syncResult.accessTokenPending,
          pendingKeycloakData: syncResult.keycloakData,
        );
        return;
      }

      if (syncResult.success && syncResult.user != null) {
        final activeRole = syncResult.user!.roles.isNotEmpty
            ? syncResult.user!.roles.first
            : 'passager';
        await _storage.saveActiveRole(activeRole);
        await _storage.deleteCodeVerifier();

        state = state.copyWith(
          isLoading: false,
          isAuthenticated: true,
          user: syncResult.user,
          activeRole: activeRole,
          availableRoles: syncResult.user!.roles,
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage:
              syncResult.errorMessage ?? 'Erreur lors de la synchronisation',
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Erreur réseau lors de la synchronisation',
      );
    }
  }

  Future<void> completeWithPhone(String numeroTelephone) async {
    final token = state.pendingAccessToken;
    if (token == null) return;

    state = state.copyWith(isLoading: true, errorMessage: null);

    final result = await _authRepository.syncUserWithPhone(
      accessToken: token,
      numeroTelephone: numeroTelephone,
    );

    if (result.success && result.user != null) {
      final activeRole = result.user!.roles.isNotEmpty
          ? result.user!.roles.first
          : 'passager';
      await _storage.saveActiveRole(activeRole);
      await _storage.deleteCodeVerifier();

      state = state.copyWith(
        isLoading: false,
        isAuthenticated: true,
        phoneRequired: false,
        pendingAccessToken: null,
        user: result.user,
        activeRole: activeRole,
        availableRoles: result.user!.roles,
      );
    } else {
      state = state.copyWith(
        isLoading: false,
        errorMessage:
            result.errorMessage ?? 'Erreur lors de la création du compte',
      );
    }
  }
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  final storage = ref.watch(secureStorageProvider);
  final keycloakService = ref.watch(keycloakAuthServiceProvider);
  return AuthRepository(
    apiService: apiService,
    storage: storage,
    keycloakService: keycloakService,
  );
});

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  final storage = ref.watch(secureStorageProvider);
  return AuthNotifier(authRepository: repository, storage: storage);
});
