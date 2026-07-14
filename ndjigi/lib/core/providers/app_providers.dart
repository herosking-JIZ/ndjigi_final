import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../network/api_service.dart';
import '../socket/socket_service.dart';
import '../storage/secure_storage.dart';
import '../services/location_service.dart';
import '../services/map_service.dart';
import '../services/notification_service.dart';
import '../services/auth_keycloak_service.dart';

/// Provides the app configuration
final appConfigProvider = Provider<AppConfig>((ref) {
  return AppConfig.instance;
});

/// Provides SecureStorage instance
final secureStorageProvider = Provider<SecureStorage>((ref) {
  return SecureStorage();
});

/// Provides SharedPreferences instance
final sharedPreferencesProvider = FutureProvider<SharedPreferences>((ref) async {
  return await SharedPreferences.getInstance();
});

/// Provides Dio instance via ApiService
final apiServiceProvider = Provider<ApiService>((ref) {
  final storage = ref.watch(secureStorageProvider);
  final config = ref.watch(appConfigProvider);

  return ApiService(storage: storage, config: config);
});

/// Provides Socket.io service instance
final socketServiceProvider = Provider<SocketService>((ref) {
  return SocketService();
});

/// Provides LocationService instance
final locationServiceProvider = Provider<LocationService>((ref) {
  return LocationService();
});

/// Provides MapService instance
final mapServiceProvider = Provider<MapService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return MapService(dio: apiService.dio);
});

/// Provides NotificationService instance
final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService();
});

/// Provides KeycloakAuthService instance
final keycloakAuthServiceProvider = Provider<KeycloakAuthService>((ref) {
  final config = ref.watch(appConfigProvider);
  final storage = ref.watch(secureStorageProvider);
  final apiService = ref.watch(apiServiceProvider);
  return KeycloakAuthService(
    config: config,
    storage: storage,
    dio: apiService.dio,
  );
});
