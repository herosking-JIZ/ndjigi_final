import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/network/api_service.dart';
import '../../../core/providers/app_providers.dart';
import '../../../shared/models/utilisateur.dart';

class ProfilePhotoRepository {
  const ProfilePhotoRepository({required ApiService apiService})
    : _apiService = apiService;

  final ApiService _apiService;

  Future<Utilisateur> upload(
    XFile image, {
    void Function(double progress)? onProgress,
  }) async {
    final formData = FormData.fromMap({
      'photo': await MultipartFile.fromFile(image.path, filename: image.name),
    });
    final response = await _apiService.dio.post<Map<String, dynamic>>(
      '/utilisateurs/profil/photo',
      data: formData,
      onSendProgress: (sent, total) {
        if (total > 0) onProgress?.call(sent / total);
      },
    );
    return _parseUser(response.data);
  }

  Future<Utilisateur> delete() async {
    final response = await _apiService.dio.delete<Map<String, dynamic>>(
      '/utilisateurs/profil/photo',
    );
    return _parseUser(response.data);
  }

  Utilisateur _parseUser(Map<String, dynamic>? response) {
    final data = response?['data'];
    if (data is! Map<String, dynamic>) {
      throw const FormatException('Réponse utilisateur invalide.');
    }
    return Utilisateur.fromJson(data);
  }
}

final profilePhotoRepositoryProvider = Provider<ProfilePhotoRepository>((ref) {
  return ProfilePhotoRepository(apiService: ref.watch(apiServiceProvider));
});
