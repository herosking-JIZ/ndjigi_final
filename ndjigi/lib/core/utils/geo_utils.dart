import 'dart:math' as math;

class GeoUtils {
  GeoUtils._();

  static const double earthRadiusKm = 6371;
  static const double earthRadiusM = 6371000;

  static double distanceBetween(
    double lat1,
    double lng1,
    double lat2,
    double lng2,
  ) {
    final dLat = _toRad(lat2 - lat1);
    final dLng = _toRad(lng2 - lng1);

    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(_toRad(lat1)) *
            math.cos(_toRad(lat2)) *
            math.sin(dLng / 2) *
            math.sin(dLng / 2);

    final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return earthRadiusM * c;
  }

  static double bearingBetween(
    double lat1,
    double lng1,
    double lat2,
    double lng2,
  ) {
    final dLng = _toRad(lng2 - lng1);
    final y = math.sin(dLng) * math.cos(_toRad(lat2));
    final x = math.cos(_toRad(lat1)) * math.sin(_toRad(lat2)) -
        math.sin(_toRad(lat1)) * math.cos(_toRad(lat2)) * math.cos(dLng);

    final bearing = _toDeg(math.atan2(y, x));
    return (bearing + 360) % 360;
  }

  static double _toRad(double degree) {
    return degree * math.pi / 180;
  }

  static double _toDeg(double radian) {
    return radian * 180 / math.pi;
  }

  static bool isPointInRadius(
    double centerLat,
    double centerLng,
    double pointLat,
    double pointLng,
    double radiusMeters,
  ) {
    return distanceBetween(centerLat, centerLng, pointLat, pointLng) <= radiusMeters;
  }

  static ({double neLat, double neLng, double swLat, double swLng}) boundingBox(
    double centerLat,
    double centerLng,
    double radiusMeters,
  ) {
    final latOffset = (radiusMeters / earthRadiusM) * (180 / math.pi);
    final lngOffset = (radiusMeters / earthRadiusM) * (180 / math.pi) / math.cos(_toRad(centerLat));

    return (
      neLat: centerLat + latOffset,
      neLng: centerLng + lngOffset,
      swLat: centerLat - latOffset,
      swLng: centerLng - lngOffset,
    );
  }
}
