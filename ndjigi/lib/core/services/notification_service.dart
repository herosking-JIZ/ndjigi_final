import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();

  late FlutterLocalNotificationsPlugin _localNotifications;
  bool _initialized = false;

  NotificationService._internal();

  factory NotificationService() {
    return _instance;
  }

  Future<void> init() async {
    try {
      _localNotifications = FlutterLocalNotificationsPlugin();

      const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
      const iosSettings = DarwinInitializationSettings(
        requestSoundPermission: true,
        requestBadgePermission: true,
        requestAlertPermission: true,
      );

      const initSettings = InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      );

      await _localNotifications.initialize(initSettings);
      _initialized = true;
      print('Notification service initialized');
    } catch (e) {
      print('Notification service initialization error: $e');
    }
  }

  Future<void> showNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    if (!_initialized) return;

    try {
      const androidDetails = AndroidNotificationDetails(
        'ndjigi_channel',
        'NDJIGI Notifications',
        importance: Importance.max,
        priority: Priority.high,
        showWhen: true,
      );

      const iosDetails = DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      );

      const details = NotificationDetails(
        android: androidDetails,
        iOS: iosDetails,
      );

      await _localNotifications.show(
        DateTime.now().hashCode,
        title,
        body,
        details,
        payload: payload,
      );
    } catch (e) {
      print('Error showing notification: $e');
    }
  }

  Future<String?> getDeviceToken() async {
    return null;
  }

  Future<void> subscribeToTopic(String topic) async {
    print('Topic subscription: $topic (disabled for development)');
  }

  Future<void> unsubscribeFromTopic(String topic) async {
    print('Topic unsubscription: $topic (disabled for development)');
  }

  Future<void> requestPermission() async {
    // Permissions already handled in init()
  }
}
