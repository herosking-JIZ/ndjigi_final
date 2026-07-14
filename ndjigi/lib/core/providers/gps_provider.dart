import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'app_providers.dart';

/// Provides a continuous stream of GPS positions
/// This is the single source of truth for location in the app
final gpsStreamProvider = StreamProvider<Position>((ref) async* {
  final locationService = ref.watch(locationServiceProvider);

  try {
    final hasPermission = await locationService.hasLocationPermission();
    if (!hasPermission) {
      await locationService.requestLocationPermission();
    }

    final isEnabled = await locationService.isLocationEnabled();
    if (!isEnabled) {
      throw Exception('Location services are disabled');
    }

    await for (final position in locationService.getPositionStream(intervalMs: 5000)) {
      yield position;
    }
  } catch (e) {
    print('GPS stream error: $e');
    rethrow;
  }
});

/// Provides the current position (last emitted from stream)
final currentPositionProvider = StreamProvider<Position?>((ref) async* {
  try {
    final locationService = ref.watch(locationServiceProvider);

    final hasPermission = await locationService.hasLocationPermission();
    if (!hasPermission) {
      await locationService.requestLocationPermission();
    }

    final position = await locationService.getCurrentPosition();
    yield position;
  } catch (e) {
    print('Current position error: $e');
    yield null;
  }
});
