import 'package:dio/dio.dart';

class NominatimPlace {
  final String placeId;
  final String displayName;
  final double latitude;
  final double longitude;
  final String? address;

  NominatimPlace({
    required this.placeId,
    required this.displayName,
    required this.latitude,
    required this.longitude,
    this.address,
  });

  factory NominatimPlace.fromJson(Map<String, dynamic> json) {
    return NominatimPlace(
      placeId: json['place_id'].toString(),
      displayName: json['display_name'] as String,
      latitude: double.parse(json['lat'].toString()),
      longitude: double.parse(json['lon'].toString()),
      address: json['address'] != null ? (json['address'] as Map).toString() : null,
    );
  }
}

class OsrmRoute {
  final List<List<double>> points;
  final double distance;
  final int duration;

  OsrmRoute({
    required this.points,
    required this.distance,
    required this.duration,
  });

  factory OsrmRoute.fromJson(Map<String, dynamic> json) {
    final routes = json['routes'] as List;
    if (routes.isEmpty) {
      throw Exception('No route found');
    }

    final route = routes.first as Map<String, dynamic>;
    final geometry = route['geometry'] as Map<String, dynamic>;
    final coordinates = (geometry['coordinates'] as List);

    final points = coordinates.cast<List>().map((coord) {
      return [
        (coord[1] as num).toDouble(),
        (coord[0] as num).toDouble(),
      ];
    }).toList();

    return OsrmRoute(
      points: points,
      distance: (route['distance'] as num).toDouble(),
      duration: (route['duration'] as num).toInt(),
    );
  }
}

class MapService {
  static const String _nominatimBaseUrl = 'https://nominatim.openstreetmap.org';
  static const String _osrmBaseUrl = 'https://router.project-osrm.org';

  final Dio _dio;

  MapService({required Dio dio}) : _dio = dio;

  Future<List<NominatimPlace>> geocode(String query) async {
    try {
      final response = await _dio.get(
        '$_nominatimBaseUrl/search',
        queryParameters: {
          'q': query,
          'format': 'json',
          'limit': 10,
        },
        options: Options(
          headers: {
            'User-Agent': 'NDJIGI-Flutter-Mobile-App/1.0',
          },
        ),
      );

      if (response.statusCode == 200 && response.data is List) {
        final places = (response.data as List)
            .map((json) => NominatimPlace.fromJson(json as Map<String, dynamic>))
            .toList();
        return places;
      }
      return [];
    } on DioException catch (e) {
      print('Geocoding error: $e');
      throw Exception('Failed to geocode: $query');
    }
  }

  Future<NominatimPlace> reverseGeocode(double latitude, double longitude) async {
    try {
      final response = await _dio.get(
        '$_nominatimBaseUrl/reverse',
        queryParameters: {
          'lat': latitude,
          'lon': longitude,
          'format': 'json',
        },
        options: Options(
          headers: {
            'User-Agent': 'NDJIGI-Flutter-Mobile-App/1.0',
          },
        ),
      );

      if (response.statusCode == 200 && response.data is Map) {
        return NominatimPlace.fromJson(response.data as Map<String, dynamic>);
      }
      throw Exception('Invalid reverse geocoding response');
    } on DioException catch (e) {
      print('Reverse geocoding error: $e');
      throw Exception('Failed to reverse geocode');
    }
  }

  Future<OsrmRoute> getRoute(
    double originLat,
    double originLng,
    double destLat,
    double destLng,
  ) async {
    try {
      final coordinates = '$originLng,$originLat;$destLng,$destLat';

      final response = await _dio.get(
        '$_osrmBaseUrl/route/v1/driving/$coordinates',
        queryParameters: {
          'overview': 'full',
          'geometries': 'geojson',
          'steps': 'true',
        },
      );

      if (response.statusCode == 200 && response.data is Map) {
        return OsrmRoute.fromJson(response.data as Map<String, dynamic>);
      }
      throw Exception('Invalid route response');
    } on DioException catch (e) {
      print('Route error: $e');
      throw Exception('Failed to get route');
    }
  }

  Future<List<List<double>>> getRouteGeometry(
    double originLat,
    double originLng,
    double destLat,
    double destLng,
  ) async {
    try {
      final route = await getRoute(originLat, originLng, destLat, destLng);
      return route.points;
    } catch (e) {
      print('Get route geometry error: $e');
      rethrow;
    }
  }
}
