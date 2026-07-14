import 'package:intl/intl.dart';

class Formatters {
  Formatters._();

  static String formatCFA(num amount) {
    final formatter = NumberFormat.currency(locale: 'fr_FR', symbol: 'CFA ');
    return formatter.format(amount);
  }

  static String formatCurrency(num amount, {String symbol = 'CFA'}) {
    final formatter = NumberFormat.currency(locale: 'en_US', symbol: '$symbol ');
    return formatter.format(amount);
  }

  static String formatDate(DateTime date, {String pattern = 'dd/MM/yyyy'}) {
    try {
      final formatter = DateFormat(pattern);
      return formatter.format(date);
    } catch (_) {
      return date.toString();
    }
  }

  static String formatDateTime(DateTime dateTime, {String pattern = 'dd/MM/yyyy HH:mm'}) {
    try {
      final formatter = DateFormat(pattern);
      return formatter.format(dateTime);
    } catch (_) {
      return dateTime.toString();
    }
  }

  static String formatTime(DateTime time, {String pattern = 'HH:mm'}) {
    try {
      final formatter = DateFormat(pattern);
      return formatter.format(time);
    } catch (_) {
      return time.toString();
    }
  }

  static String formatDuration(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);
    final seconds = duration.inSeconds.remainder(60);

    if (hours > 0) {
      return '$hours h $minutes min';
    } else if (minutes > 0) {
      return '$minutes min $seconds s';
    } else {
      return '$seconds s';
    }
  }

  static String formatDistance(double meters) {
    if (meters < 1000) {
      return '${meters.toStringAsFixed(0)} m';
    } else {
      final km = meters / 1000;
      return '${km.toStringAsFixed(1)} km';
    }
  }

  static String formatPhoneNumber(String phone) {
    // Format: +XX XXX XXX XXX
    phone = phone.replaceAll(RegExp(r'\D'), '');

    if (phone.length >= 10) {
      return '+${phone.substring(0, phone.length - 9)} ${phone.substring(phone.length - 9, phone.length - 6)} ${phone.substring(phone.length - 6, phone.length - 3)} ${phone.substring(phone.length - 3)}';
    }
    return phone;
  }
}
