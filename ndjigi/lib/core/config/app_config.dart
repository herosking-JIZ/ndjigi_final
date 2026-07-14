enum Flavor { dev, staging, prod }

class AppConfig {
  static late Flavor _flavor;
  static late AppConfig _instance;

  final String apiBaseUrl;
  final String socketUrl;
  final String tileServerUrl;
  final String keycloakUrl;
  final String keycloakRealm;
  final String keycloakClientId;
  final String redirectUri;
  final String logoutRedirectUri;
  final bool enableAnalytics;
  final bool enableCrashlytics;

  AppConfig._({
    required this.apiBaseUrl,
    required this.socketUrl,
    required this.tileServerUrl,
    required this.keycloakUrl,
    required this.keycloakRealm,
    required this.keycloakClientId,
    required this.redirectUri,
    required this.logoutRedirectUri,
    required this.enableAnalytics,
    required this.enableCrashlytics,
  });

  // ─── Getters Keycloak ───────────────────────────────────────────
  String get keycloakIssuerUrl => '$keycloakUrl/realms/$keycloakRealm';
  String get keycloakAuthEndpoint =>
      '$keycloakIssuerUrl/protocol/openid-connect/auth';
  String get keycloakTokenEndpoint =>
      '$keycloakIssuerUrl/protocol/openid-connect/token';
  String get keycloakUserInfoEndpoint =>
      '$keycloakIssuerUrl/protocol/openid-connect/userinfo';
  String get keycloakLogoutEndpoint =>
      '$keycloakIssuerUrl/protocol/openid-connect/logout';

  // ─── Getters statiques ──────────────────────────────────────────
  static AppConfig get instance => _instance;
  static Flavor get flavor => _flavor;
  static bool get isDebug => _flavor == Flavor.dev;
  static bool get isStaging => _flavor == Flavor.staging;
  static bool get isProd => _flavor == Flavor.prod;

  // ─── Setup ──────────────────────────────────────────────────────
  static void setup({required Flavor flavor}) {
    _flavor = flavor;

    late String apiBaseUrl;
    late String socketUrl;
    late String tileServerUrl;
    late String keycloakUrl;
    const String keycloakRealm = 'ndjigi';
    const String keycloakClientId = 'ndjigi-mobile';
    const String redirectUri = 'ndjigi-mobile://callback';
    const String logoutRedirectUri = 'ndjigi-mobile://logout-callback';
    late bool enableAnalytics;
    late bool enableCrashlytics;

    switch (flavor) {
      case Flavor.dev:
        apiBaseUrl = const String.fromEnvironment(
          'API_BASE_URL',
          defaultValue: 'http://192.168.11.104:8000/api/v1',
        );
        socketUrl = const String.fromEnvironment(
          'SOCKET_URL',
          defaultValue: 'http://192.168.11.104:8000',
        );
        tileServerUrl = const String.fromEnvironment(
          'TILE_URL',
          defaultValue: 'https://tile.openstreetmap.org',
        );
        keycloakUrl = const String.fromEnvironment(
          'KEYCLOAK_URL',
          defaultValue: 'http://192.168.11.104:8080',
        );
        enableAnalytics = false;
        enableCrashlytics = false;
        break;

      case Flavor.staging:
        apiBaseUrl = const String.fromEnvironment(
          'API_BASE_URL',
          defaultValue: 'https://staging-api.ndjigi.app/api/v1',
        );
        socketUrl = const String.fromEnvironment(
          'SOCKET_URL',
          defaultValue: 'https://staging-api.ndjigi.app',
        );
        tileServerUrl = const String.fromEnvironment(
          'TILE_URL',
          defaultValue: 'https://tile.openstreetmap.org',
        );
        keycloakUrl = const String.fromEnvironment(
          'KEYCLOAK_URL',
          defaultValue: 'https://staging-api.ndjigi.app',
        );
        enableAnalytics = true;
        enableCrashlytics = true;
        break;

      case Flavor.prod:
        apiBaseUrl = const String.fromEnvironment(
          'API_BASE_URL',
          defaultValue: 'https://api.ndjigi.app/api/v1',
        );
        socketUrl = const String.fromEnvironment(
          'SOCKET_URL',
          defaultValue: 'https://api.ndjigi.app',
        );
        tileServerUrl = const String.fromEnvironment(
          'TILE_URL',
          defaultValue: 'https://tile.openstreetmap.org',
        );
        keycloakUrl = const String.fromEnvironment(
          'KEYCLOAK_URL',
          defaultValue: 'https://api.ndjigi.app',
        );
        enableAnalytics = true;
        enableCrashlytics = true;
        break;
    }

    _instance = AppConfig._(
      apiBaseUrl: apiBaseUrl,
      socketUrl: socketUrl,
      tileServerUrl: tileServerUrl,
      keycloakUrl: keycloakUrl,
      keycloakRealm: keycloakRealm,
      keycloakClientId: keycloakClientId,
      redirectUri: redirectUri,
      logoutRedirectUri: logoutRedirectUri,
      enableAnalytics: enableAnalytics,
      enableCrashlytics: enableCrashlytics,
    );
  }
}
