import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_service.dart';
import '../../../core/providers/app_providers.dart';
import 'models/location_owner_view.dart';

// ── Repository pour le suivi des locations (réservations de véhicules) ─

class LocationRepository {
  final ApiService _apiService;

  LocationRepository({required ApiService apiService}) : _apiService = apiService;

  /// GET /locations/mes-locations?statut=en_attente|active|historique
  Future<List<LocationOwnerView>> getMesLocations({String? statut}) async {
    final response = await _apiService.get<Map<String, dynamic>>(
      '/locations/mes-locations',
      queryParameters: statut != null ? {'statut': statut} : null,
    );
    final data = response['data'];
    if (data is List) {
      return data.map((item) => LocationOwnerView.fromJson(item as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// GET /locations/:id
  Future<LocationOwnerView> getLocation(String idLocation) async {
    final response = await _apiService.get<Map<String, dynamic>>('/locations/$idLocation');
    return LocationOwnerView.fromJson(response['data'] as Map<String, dynamic>);
  }

  /// PATCH /locations/:id/accepter
  Future<void> accepter(String idLocation) async {
    await _apiService.patch('/locations/$idLocation/accepter');
  }

  /// PATCH /locations/:id/refuser
  Future<void> refuser(String idLocation) async {
    await _apiService.patch('/locations/$idLocation/refuser');
  }
}

// ── Provider ──────────────────────────────────────────────────────────

final locationRepositoryProvider = Provider<LocationRepository>((ref) {
  return LocationRepository(apiService: ref.watch(apiServiceProvider));
});
