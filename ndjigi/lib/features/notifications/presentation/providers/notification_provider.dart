import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/notification_repository.dart';
import '../../data/models/notification.dart';

// ── État des notifications ─────────────────────────────────────────

class NotificationState {
  final bool isLoading;
  final List<AppNotification> notifications;
  final String? errorMessage;

  NotificationState({
    this.isLoading = true,
    this.notifications = const [],
    this.errorMessage,
  });

  int get unreadCount => notifications.where((n) => !n.lu).length;

  NotificationState copyWith({
    bool? isLoading,
    List<AppNotification>? notifications,
    String? errorMessage,
  }) {
    return NotificationState(
      isLoading: isLoading ?? this.isLoading,
      notifications: notifications ?? this.notifications,
      errorMessage: errorMessage,
    );
  }
}

// ── StateNotifier ────────────────────────────────────────────────────

class NotificationNotifier extends StateNotifier<NotificationState> {
  final NotificationRepository _repository;

  NotificationNotifier({required NotificationRepository repository})
      : _repository = repository,
        super(NotificationState());

  /// Charge les notifications de l'utilisateur connecté
  Future<void> loadNotifications() async {
    try {
      state = state.copyWith(isLoading: true, errorMessage: null);
      final notifications = await _repository.getNotifications();
      state = state.copyWith(isLoading: false, notifications: notifications);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Erreur lors du chargement des notifications',
      );
    }
  }

  /// Marque une notification comme lue (optimiste, avec rollback si échec)
  Future<void> markAsRead(String id) async {
    final index = state.notifications.indexWhere((n) => n.idNotification == id);
    if (index == -1 || state.notifications[index].lu) return;

    final previous = state.notifications;
    final updated = [...previous];
    updated[index] = updated[index].copyWith(lu: true, dateLecture: DateTime.now());
    state = state.copyWith(notifications: updated);

    try {
      await _repository.markAsRead(id);
    } catch (e) {
      state = state.copyWith(notifications: previous);
    }
  }

  /// Marque toutes les notifications comme lues (optimiste, avec rollback si échec)
  Future<void> markAllAsRead() async {
    if (state.unreadCount == 0) return;

    final previous = state.notifications;
    final updated = previous
        .map((n) => n.lu ? n : n.copyWith(lu: true, dateLecture: DateTime.now()))
        .toList();
    state = state.copyWith(notifications: updated);

    try {
      await _repository.markAllAsRead();
    } catch (e) {
      state = state.copyWith(notifications: previous);
    }
  }
}

// ── Provider ─────────────────────────────────────────────────────────
//
// Pas d'autoDispose : le compteur de non-lues est affiché sur les
// écrans d'accueil (badge cloche) et doit rester en cache entre les
// navigations plutôt que de refetch à chaque fois.

final notificationProvider =
    StateNotifierProvider<NotificationNotifier, NotificationState>((ref) {
  return NotificationNotifier(
    repository: ref.watch(notificationRepositoryProvider),
  );
});
