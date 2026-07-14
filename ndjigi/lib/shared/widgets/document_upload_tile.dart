import 'package:flutter/material.dart';
import 'package:path/path.dart' as p;
import '../../core/theme/colors.dart';
import '../../core/theme/text_styles.dart';
import '../../features/profil/presentation/providers/demande_extension_provider.dart';

// ── Widget réutilisable pour l'upload d'un document ─────────────────

class DocumentUploadTile extends StatelessWidget {
  final String label;
  final DocumentUploadState uploadState;
  final VoidCallback onPickFile;
  final VoidCallback onUpload;

  const DocumentUploadTile({
    super.key,
    required this.label,
    required this.uploadState,
    required this.onPickFile,
    required this.onUpload,
  });

  @override
  Widget build(BuildContext context) {
    final fileName = uploadState.localFilePath != null
        ? p.basename(uploadState.localFilePath!)
        : null;
    final hasFile = uploadState.localFilePath != null;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── En-tête: icône + label + statut ──────────────────────
          Row(
            children: [
              _buildStatusIcon(),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: AppTextStyles.bodyMedium.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    _buildStatusText(),
                  ],
                ),
              ),
            ],
          ),
          // ── Fichier choisi (si présent) ───────────────────────────
          if (hasFile) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                fileName!,
                style: AppTextStyles.labelSmall,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
          // ── Barre de progression (si upload en cours) ──────────────
          if (uploadState.status == UploadStatus.uploading) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: uploadState.progress,
                minHeight: 6,
                backgroundColor: AppColors.surface,
                valueColor: AlwaysStoppedAnimation<Color>(
                  AppColors.primary.withValues(alpha: 0.7),
                ),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '${(uploadState.progress * 100).toStringAsFixed(0)}%',
              style: AppTextStyles.labelSmall.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ],
          // ── Message d'erreur (si erreur) ──────────────────────────
          if (uploadState.status == UploadStatus.error &&
              uploadState.errorMessage != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.error.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                uploadState.errorMessage!,
                style: AppTextStyles.labelSmall.copyWith(
                  color: AppColors.error,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
          // ── Boutons d'action ──────────────────────────────────────
          const SizedBox(height: 12),
          _buildActionButtons(),
        ],
      ),
    );
  }

  // ── Icône de statut ────────────────────────────────────────────────

  Widget _buildStatusIcon() {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: _getStatusColor().withValues(alpha: 0.1),
      ),
      child: Center(
        child: Icon(
          _getStatusIconData(),
          color: _getStatusColor(),
          size: 20,
        ),
      ),
    );
  }

  IconData _getStatusIconData() {
    return switch (uploadState.status) {
      UploadStatus.idle => Icons.cloud_upload_outlined,
      UploadStatus.uploading => Icons.cloud_upload_outlined,
      UploadStatus.ready => Icons.check_circle,
      UploadStatus.error => Icons.error_outline,
    };
  }

  Color _getStatusColor() {
    return switch (uploadState.status) {
      UploadStatus.idle => AppColors.textSecondary,
      UploadStatus.uploading => AppColors.primary,
      UploadStatus.ready => AppColors.success,
      UploadStatus.error => AppColors.error,
    };
  }

  // ── Texte de statut ───────────────────────────────────────────────

  Widget _buildStatusText() {
    final text = switch (uploadState.status) {
      UploadStatus.idle =>
        uploadState.localFilePath == null ? 'Non chargé' : 'Prêt à envoyer',
      UploadStatus.uploading => 'Envoi en cours...',
      UploadStatus.ready => 'Chargé avec succès',
      UploadStatus.error => 'Erreur lors de l\'envoi',
    };

    return Text(
      text,
      style: AppTextStyles.labelSmall.copyWith(
        color: _getStatusColor(),
      ),
    );
  }

  // ── Boutons d'action ──────────────────────────────────────────────

  Widget _buildActionButtons() {
    final isDisabled = uploadState.status == UploadStatus.uploading;

    if (uploadState.status == UploadStatus.ready) {
      return SizedBox.shrink();
    }

    if (uploadState.status == UploadStatus.error) {
      return Wrap(
        spacing: 8,
        children: [
          OutlinedButton.icon(
            onPressed: isDisabled ? null : onPickFile,
            icon: const Icon(Icons.edit, size: 16),
            label: const Text('Changer'),
          ),
          ElevatedButton.icon(
            onPressed: isDisabled ? null : onUpload,
            icon: const Icon(Icons.refresh, size: 16),
            label: const Text('Réessayer'),
          ),
        ],
      );
    }

    // Idle ou uploading
    return Wrap(
      spacing: 8,
      children: [
        OutlinedButton.icon(
          onPressed: isDisabled ? null : onPickFile,
          icon: const Icon(Icons.folder_open, size: 16),
          label: const Text('Choisir fichier'),
        ),
        if (uploadState.localFilePath != null)
          ElevatedButton.icon(
            onPressed: isDisabled ? null : onUpload,
            icon: isDisabled
                ? const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.cloud_upload, size: 16),
            label: const Text('Envoyer'),
          ),
      ],
    );
  }
}
