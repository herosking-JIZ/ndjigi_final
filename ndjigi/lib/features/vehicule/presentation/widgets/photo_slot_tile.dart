import 'package:flutter/material.dart';
import 'package:path/path.dart' as p;
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../profil/presentation/providers/demande_extension_provider.dart'
    show UploadStatus, DocumentUploadState;

/// Ligne "sélectionner un fichier" réutilisée pour la carte grise et les
/// 5 emplacements photo du formulaire véhicule. L'envoi réel n'a lieu qu'à
/// la soumission du formulaire (voir VehiculeFormNotifier) : ce widget ne
/// fait que refléter l'état idle/uploading/ready/error du slot.
class PhotoSlotTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final DocumentUploadState uploadState;
  final VoidCallback onTap;

  const PhotoSlotTile({
    required this.icon,
    required this.label,
    required this.uploadState,
    required this.onTap,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final fileName =
        uploadState.localFilePath != null ? p.basename(uploadState.localFilePath!) : null;

    return InkWell(
      onTap: uploadState.status == UploadStatus.uploading ? null : onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(icon, color: _couleur(), size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  Text(
                    _sousTitre(fileName),
                    style: AppTextStyles.bodySmall.copyWith(color: _couleur()),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            _trailing(),
          ],
        ),
      ),
    );
  }

  Widget _trailing() {
    return switch (uploadState.status) {
      UploadStatus.uploading => const SizedBox(
          width: 20,
          height: 20,
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      UploadStatus.ready => const Icon(Icons.check_circle, color: AppColors.success),
      UploadStatus.error => const Icon(Icons.error_outline, color: AppColors.error),
      UploadStatus.idle => const Icon(Icons.add_circle, color: AppColors.accent),
    };
  }

  String _sousTitre(String? fileName) {
    return switch (uploadState.status) {
      UploadStatus.uploading => 'Envoi en cours...',
      UploadStatus.ready => 'Ajouté',
      UploadStatus.error => uploadState.errorMessage ?? 'Erreur lors de l\'envoi',
      UploadStatus.idle => fileName ?? 'Cliquez pour ajouter',
    };
  }

  Color _couleur() {
    return switch (uploadState.status) {
      UploadStatus.uploading => AppColors.primary,
      UploadStatus.ready => AppColors.success,
      UploadStatus.error => AppColors.error,
      UploadStatus.idle => AppColors.textSecondary,
    };
  }
}
