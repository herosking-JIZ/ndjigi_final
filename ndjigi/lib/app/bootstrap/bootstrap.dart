import 'package:shared_preferences/shared_preferences.dart';
import '../../core/config/app_config.dart';
import '../../core/services/notification_service.dart';

Future<void> bootstrap({required Flavor flavor}) async {
  // Setup configuration first
  AppConfig.setup(flavor: flavor);

  // Initialize SharedPreferences
  await SharedPreferences.getInstance();

  // Initialize notifications
  final notificationService = NotificationService();
  try {
    await notificationService.init();
    print('Notification service initialized');
  } catch (e) {
    print('Notification service initialization failed: $e');
  }
}
