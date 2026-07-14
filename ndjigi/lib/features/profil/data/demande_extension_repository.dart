import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_service.dart';
import '../../../core/providers/app_providers.dart';
import 'models/demande_extension.dart';

// ── Repository pour les demandes d'extension de profil ──────────────

class DemandeExtensionRepository {
  final ApiService _apiService;

  DemandeExtensionRepository({required ApiService apiService})
      : _apiService = apiService;

  /// GET /demandes-extension/mes-demandes
  /// Récupère les demandes d'extension de l'utilisateur connecté
  Future<List<DemandeExtension>> getMesDemandes() async {
    final response = await _apiService.get<Map<String, dynamic>>(
      '/demandes-extension/mes-demandes',
    );

    final data = response['data'];
    if (data is List) {
      return data
          .map((item) => DemandeExtension.fromJson(item as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// POST /demandes-extension
  /// Crée une nouvelle demande d'extension
  /// Retourne la demande créée avec ses documents
  Future<DemandeExtension> createDemande(String extensionType) async {
    final response = await _apiService.post<Map<String, dynamic>>(
      '/demandes-extension',
      data: {'extension_type': extensionType},
    );

    final data = response['data'];
    return DemandeExtension.fromJson(data as Map<String, dynamic>);
  }

  /// POST /documents (multipart)
  /// Upload un document au serveur
  /// Paramètres:
  ///   - filePath: chemin local du fichier
  ///   - mimeType: type MIME du fichier (ex: "image/png", "application/pdf")
  ///   - documentType: type de document selon le backend (ex: "permis-de-conduite")
  ///   - onProgress: callback pour suivre la progression (0.0 à 1.0)
  /// Retourne: l'ID du document créé
  Future<String> uploadDocument({
    required String filePath,
    required String mimeType,
    required String documentType,
    void Function(double)? onProgress,
  }) async {
    final file = await MultipartFile.fromFile(filePath);
    final formData = FormData.fromMap({
      'fichier': file,
      'type': documentType,
    });

    final response = await _apiService.dio.post<Map<String, dynamic>>(
      '/documents',
      data: formData,
      onSendProgress: (sent, total) {
        if (total > 0) {
          onProgress?.call(sent / total);
        }
      },
    );

    final responseData = response.data;
    if (responseData == null) {
      throw Exception('Réponse serveur vide');
    }

    final data = responseData['data'] as Map<String, dynamic>;
    return data['id_document'] as String;
  }
}

// ── Provider ──────────────────────────────────────────────────────────

final demandeExtensionRepositoryProvider = Provider<DemandeExtensionRepository>((ref) {
  return DemandeExtensionRepository(apiService: ref.watch(apiServiceProvider));
});
