import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_service.dart';
import '../../../core/providers/app_providers.dart';
import 'models/vehicule.dart';

// ── Repository partagé véhicule (course + location) — flotte, documents, photos ─

class VehiculeRepository {
  final ApiService _apiService;

  VehiculeRepository({required ApiService apiService}) : _apiService = apiService;

  /// URL absolue pour afficher une photo servie par le backend
  String urlPhoto(String idPhoto) => '${_apiService.dio.options.baseUrl}/photos/$idPhoto/file?inline=true';

  /// GET /proprietaire/mes-vehicules — malgré son nom, cette route backend
  /// fonctionne pour tout créateur de véhicule (chauffeur inclus) : elle
  /// filtre par id_proprietaire = utilisateur connecté, qui est auto-
  /// provisionné pour tout véhicule de course également.
  Future<List<Vehicule>> getMesVehicules() async {
    final response = await _apiService.get<Map<String, dynamic>>('/proprietaire/mes-vehicules');
    final data = response['data'];
    if (data is List) {
      return data.map((item) => Vehicule.fromJson(item as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// GET /vehicules/:id
  Future<Vehicule> getVehicule(String idVehicule) async {
    final response = await _apiService.get<Map<String, dynamic>>('/vehicules/$idVehicule');
    return Vehicule.fromJson(response['data'] as Map<String, dynamic>);
  }

  /// POST /vehicules
  /// [type] détermine le sous-type créé côté backend : 'course' (requiert
  /// [typeService]) ou 'location' (tarifs optionnels).
  Future<Vehicule> creerVehicule({
    required String type,
    required String marque,
    required String modele,
    required int annee,
    required String couleur,
    required String immatriculation,
    required int nbPlaces,
    required String idCategorie,
    required bool climatisation,
    bool gpsActif = false,
    String? typeService,
    double? tarifBaseLocation,
    double? tarifParJourLocation,
  }) async {
    final response = await _apiService.post<Map<String, dynamic>>(
      '/vehicules',
      data: {
        'type': type,
        'marque': marque,
        'modele': modele,
        'annee': annee,
        'couleur': couleur,
        'immatriculation': immatriculation,
        'nb_places': nbPlaces,
        'id_categorie': idCategorie,
        'climatisation': climatisation,
        'gps_actif': gpsActif,
        if (type == 'course') 'type_service': typeService,
        if (type == 'location' && tarifBaseLocation != null) 'tarif_base_location': tarifBaseLocation,
        if (type == 'location' && tarifParJourLocation != null) 'tarif_par_jour_location': tarifParJourLocation,
      },
    );
    return Vehicule.fromJson(response['data'] as Map<String, dynamic>);
  }

  /// PATCH /vehicules/:id
  Future<Vehicule> modifierVehicule(
    String idVehicule, {
    String? couleur,
    bool? climatisation,
    String? statut,
    String? idCategorie,
    bool? gpsActif,
    int? nbPlaces,
    String? typeService,
    double? tarifBaseLocation,
    double? tarifParJourLocation,
  }) async {
    final response = await _apiService.patch<Map<String, dynamic>>(
      '/vehicules/$idVehicule',
      data: {
        'couleur': ?couleur,
        'climatisation': ?climatisation,
        'statut': ?statut,
        'id_categorie': ?idCategorie,
        'gps_actif': ?gpsActif,
        'nb_places': ?nbPlaces,
        'type_service': ?typeService,
        'tarif_base_location': ?tarifBaseLocation,
        'tarif_par_jour_location': ?tarifParJourLocation,
      },
    );
    return Vehicule.fromJson(response['data'] as Map<String, dynamic>);
  }

  /// GET /photos/vehicule/:id — galerie photos d'un véhicule
  Future<List<PhotoVehicule>> getPhotosVehicule(String idVehicule) async {
    final response = await _apiService.get<Map<String, dynamic>>('/photos/vehicule/$idVehicule');
    final data = response['data'];
    final photos = data is Map<String, dynamic> ? data['photos'] : null;
    if (photos is List) {
      return photos.map((item) => PhotoVehicule.fromJson(item as Map<String, dynamic>)).toList();
    }
    return [];
  }

  /// POST /photos (multipart) — une photo pour un slot du véhicule
  Future<String> uploadPhotoVehicule({
    required String idVehicule,
    required String filePath,
    required int ordre,
    required bool isPrincipale,
    String? legende,
    void Function(double)? onProgress,
  }) async {
    final formData = FormData.fromMap({
      'ownerType': 'vehicule',
      'ownerId': idVehicule,
      'ordre': ordre.toString(),
      'isPrincipale': isPrincipale.toString(),
      'legende': ?legende,
      'photos': await MultipartFile.fromFile(filePath),
    });

    final response = await _apiService.dio.post<Map<String, dynamic>>(
      '/photos',
      data: formData,
      onSendProgress: (sent, total) {
        if (total > 0) onProgress?.call(sent / total);
      },
    );

    final data = response.data?['data'] as Map<String, dynamic>?;
    final photos = data?['photos'] as List?;
    if (photos == null || photos.isEmpty) {
      throw Exception('Réponse serveur vide');
    }
    return (photos.first as Map<String, dynamic>)['id_photo'] as String;
  }

  /// POST /documents (multipart) — document rattaché à un véhicule (carte grise, assurance)
  Future<String> uploadDocumentVehicule({
    required String idVehicule,
    required String type,
    required String filePath,
    DateTime? dateExpiration,
    void Function(double)? onProgress,
  }) async {
    final formData = FormData.fromMap({
      'type': type,
      'id_vehicule': idVehicule,
      if (dateExpiration != null) 'date_expiration': dateExpiration.toIso8601String(),
      'fichier': await MultipartFile.fromFile(filePath),
    });

    final response = await _apiService.dio.post<Map<String, dynamic>>(
      '/documents',
      data: formData,
      onSendProgress: (sent, total) {
        if (total > 0) onProgress?.call(sent / total);
      },
    );

    final data = response.data?['data'] as Map<String, dynamic>?;
    if (data == null) throw Exception('Réponse serveur vide');
    return data['id_document'] as String;
  }

  /// GET /documents/me?id_vehicule=
  Future<List<DocumentVehicule>> getDocumentsVehicule(String idVehicule) async {
    final response = await _apiService.get<Map<String, dynamic>>(
      '/documents/me',
      queryParameters: {'id_vehicule': idVehicule},
    );
    final data = response['data'];
    if (data is List) {
      return data.map((item) => DocumentVehicule.fromJson(item as Map<String, dynamic>)).toList();
    }
    return [];
  }
}

// ── Provider ──────────────────────────────────────────────────────────

final vehiculeRepositoryProvider = Provider<VehiculeRepository>((ref) {
  return VehiculeRepository(apiService: ref.watch(apiServiceProvider));
});
