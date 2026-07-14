import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_service.dart';
import '../../../core/providers/app_providers.dart';
import 'models/course.dart';

// ── Repository pour le flux VTC ──────────────────────────────────────

class CourseRepository {
  final ApiService _apiService;

  CourseRepository({required ApiService apiService}) : _apiService = apiService;

  /// GET /config/categories?actif=true
  Future<List<CategorieVehicule>> getCategoriesVehicule() async {
    final response = await _apiService.get<Map<String, dynamic>>(
      '/config/categories',
      queryParameters: {'actif': 'true'},
    );
    final data = response['data'];
    final liste = data is Map<String, dynamic> ? data['data'] : data;
    if (liste is List) {
      return liste
          .map((item) => CategorieVehicule.fromJson(item as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// POST /trajets/tarif — estimation avant la demande
  Future<double?> estimerTarif({
    required String idZone,
    required String idCategorie,
    required double distanceKm,
    required int dureeMin,
  }) async {
    final response = await _apiService.post<Map<String, dynamic>>(
      '/trajets/tarif',
      data: {
        'id_zone': idZone,
        'id_categorie': idCategorie,
        'distance_km': distanceKm,
        'duree_min': dureeMin,
      },
    );
    final data = response['data'] as Map<String, dynamic>?;
    final tarif = data?['tarif_final'];
    if (tarif is num) return tarif.toDouble();
    if (tarif is String) return double.tryParse(tarif);
    return null;
  }

  /// POST /trajets/demande — lance le matching automatique
  Future<String> demanderCourse({
    required String adresseDepart,
    required String adresseArrivee,
    required double latitudeDepart,
    required double longitudeDepart,
    required double latitudeArrivee,
    required double longitudeArrivee,
    required String idCategorie,
    String? idZone,
    double? distanceKm,
    int? dureeEstimeeMin,
  }) async {
    final response = await _apiService.post<Map<String, dynamic>>(
      '/trajets/demande',
      data: {
        'adresse_depart': adresseDepart,
        'adresse_arrivee': adresseArrivee,
        'coordonnees_depart': {'latitude': latitudeDepart, 'longitude': longitudeDepart},
        'coordonnees_arrivee': {'latitude': latitudeArrivee, 'longitude': longitudeArrivee},
        'id_categorie': idCategorie,
        'id_zone': ?idZone,
        'distance_km': ?distanceKm,
        'duree_estimee_min': ?dureeEstimeeMin,
      },
    );
    final data = response['data'] as Map<String, dynamic>;
    return data['id_trajet'] as String;
  }

  /// GET /trajets/:id — état complet et à jour d'une course
  Future<Course> getTrajet(String idTrajet) async {
    final response = await _apiService.get<Map<String, dynamic>>('/trajets/$idTrajet');
    return Course.fromJson(response['data'] as Map<String, dynamic>);
  }

  /// GET /trajets/historique
  Future<List<Course>> getHistorique() async {
    final response = await _apiService.get<Map<String, dynamic>>('/trajets/historique');
    final data = response['data'];
    if (data is List) {
      return data.map((item) => Course.fromJson(item as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// PATCH /trajets/:id/confirmer — confirmation explicite (chauffeur ou passager)
  Future<void> confirmerCourse(String idTrajet) async {
    await _apiService.patch('/trajets/$idTrajet/confirmer');
  }

  /// PATCH /trajets/:id/confirmer-identite — vérification chauffeur à l'arrivée
  Future<void> confirmerIdentite(String idTrajet) async {
    await _apiService.patch('/trajets/$idTrajet/confirmer-identite');
  }

  /// PATCH /trajets/:id/annuler
  Future<void> annulerCourse(String idTrajet, {required String motif}) async {
    await _apiService.patch('/trajets/$idTrajet/annuler', data: {'motif': motif});
  }

  /// POST /avis/avis — notation mutuelle en fin de course
  Future<void> noterChauffeur({
    required String idTrajet,
    required String idChauffeur,
    required int note,
    String? commentaire,
  }) async {
    await _apiService.post(
      '/avis/avis',
      data: {
        'id_evalue': idChauffeur,
        'id_trajet': idTrajet,
        'note': note,
        if (commentaire != null && commentaire.trim().isNotEmpty) 'commentaire': commentaire.trim(),
      },
    );
  }
}

// ── Provider ──────────────────────────────────────────────────────────

final courseRepositoryProvider = Provider<CourseRepository>((ref) {
  return CourseRepository(apiService: ref.watch(apiServiceProvider));
});
