import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_service.dart';
import '../../../core/providers/app_providers.dart';
import 'models/notification.dart';

// ── Repository pour les notifications ────────────────────────────────

class NotificationRepository {
  final ApiService _apiService;

  NotificationRepository({required ApiService apiService})
      : _apiService = apiService;

  /// GET /notification
  Future<List<AppNotification>> getNotifications() async {
    final response = await _apiService.get<Map<String, dynamic>>(
      '/notification',
    );

    final data = response['data'];
    if (data is List) {
      return data
          .map((item) => AppNotification.fromJson(item as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// PATCH /notification/:id/lire
  Future<void> markAsRead(String id) async {
    await _apiService.patch('/notification/$id/lire');
  }

  /// PATCH /notification/lire-tout
  Future<void> markAllAsRead() async {
    await _apiService.patch('/notification/lire-tout');
  }
}

// ── Provider ──────────────────────────────────────────────────────────

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  return NotificationRepository(apiService: ref.watch(apiServiceProvider));
});
