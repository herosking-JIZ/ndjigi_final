import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_service.dart';
import '../../../core/providers/app_providers.dart';
import 'models/location_passager_view.dart';
import 'models/vehicule_location_detail.dart';
import 'models/vehicule_location_resume.dart';

// ── Repository pour le flux passager de location de véhicule ─────────

class LocationPassagerRepository {
  final ApiService _apiService;

  LocationPassagerRepository({required ApiService apiService}) : _apiService = apiService;

  /// GET /locations/vehicules — recherche des véhicules disponibles à la location
  Future<List<VehiculeLocationResume>> rechercherVehicules({
    String? idCategorie,
    DateTime? dateDebut,
    DateTime? dateFin,
  }) async {
    final response = await _apiService.get<Map<String, dynamic>>(
      '/locations/vehicules',
      queryParameters: {
        'id_categorie': ?idCategorie,
        'date_debut': ?dateDebut?.toIso8601String(),
        'date_fin': ?dateFin?.toIso8601String(),
      },
    );
    final data = response['data'];
    if (data is List) {
      return data.map((item) => VehiculeLocationResume.fromJson(item as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// GET /locations/vehicules/:id — détail public d'un véhicule
  Future<VehiculeLocationDetail> getDetailVehicule(String idVehicule) async {
    final response = await _apiService.get<Map<String, dynamic>>('/locations/vehicules/$idVehicule');
    return VehiculeLocationDetail.fromJson(response['data'] as Map<String, dynamic>);
  }

  /// POST /locations — envoyer une demande de location
  Future<void> creerDemande({
    required String idVehicule,
    required DateTime dateDebut,
    required DateTime dateFin,
  }) async {
    await _apiService.post<Map<String, dynamic>>(
      '/locations',
      data: {
        'id_vehicule': idVehicule,
        'date_debut': dateDebut.toIso8601String(),
        'date_fin': dateFin.toIso8601String(),
      },
    );
  }

  /// GET /locations/mes-demandes?statut=en_attente|active|historique
  Future<List<LocationPassagerView>> getMesDemandes({String? statut}) async {
    final response = await _apiService.get<Map<String, dynamic>>(
      '/locations/mes-demandes',
      queryParameters: statut != null ? {'statut': statut} : null,
    );
    final data = response['data'];
    if (data is List) {
      return data.map((item) => LocationPassagerView.fromJson(item as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// PATCH /locations/:id/annuler
  Future<void> annuler(String idLocation) async {
    await _apiService.patch('/locations/$idLocation/annuler');
  }

  /// POST /avis/avis — noter le propriétaire à la fin d'une location
  Future<void> noterProprietaire({
    required String idLocation,
    required String idProprietaire,
    required int note,
    String? commentaire,
  }) async {
    await _apiService.post(
      '/avis/avis',
      data: {
        'id_evalue': idProprietaire,
        'id_location': idLocation,
        'note': note,
        if (commentaire != null && commentaire.trim().isNotEmpty) 'commentaire': commentaire.trim(),
      },
    );
  }
}

// ── Provider ──────────────────────────────────────────────────────────

final locationPassagerRepositoryProvider = Provider<LocationPassagerRepository>((ref) {
  return LocationPassagerRepository(apiService: ref.watch(apiServiceProvider));
});
