import 'package:flutter/material.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../shared/widgets/document_upload_tile.dart';
import '../providers/demande_extension_provider.dart';

// ── WIDGET : DocumentsUploadSection ──────────────────────────────────
//
// Liste bornée à quelques documents (voir `kRequiredDocs`) : une simple
// `Column` suffit, pas besoin de `ListView` + `shrinkWrap` (coûteux et
// redondant à l'intérieur d'un `SingleChildScrollView` déjà scrollable).
// Chaque `DocumentUploadTile` reçoit une `Key` stable (`ValueKey(docType)`)
// par bonne pratique de préservation d'identité dans la liste.

class DocumentsUploadSection extends StatelessWidget {
  const DocumentsUploadSection({
    super.key,
    required this.docs,
    required this.onPickFile,
    required this.onUpload,
  });

  final Map<String, DocumentUploadState> docs;
  final void Function(String docType) onPickFile;
  final void Function(String docType) onUpload;

  @override
  Widget build(BuildContext context) {
    final entries = docs.entries.toList(growable: false);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Documents requis', style: AppTextStyles.titleMedium),
        const SizedBox(height: 12),
        Text(
          'Chargez chaque document pour valider votre demande.',
          style: AppTextStyles.bodySmall.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 16),
        for (final entry in entries) ...[
          if (entry != entries.first) const SizedBox(height: 16),
          DocumentUploadTile(
            key: ValueKey(entry.key),
            label: kDocLabels[entry.key] ?? entry.key,
            uploadState: entry.value,
            onPickFile: () => onPickFile(entry.key),
            onUpload: () => onUpload(entry.key),
          ),
        ],
        const SizedBox(height: 16),
      ],
    );
  }
}
