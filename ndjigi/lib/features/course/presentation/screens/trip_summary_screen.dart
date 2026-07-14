import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/routes.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/section_card.dart';
import '../providers/course_provider.dart';

// ── Résumé de fin de course ───────────────────────────────────────────

class TripSummaryScreen extends ConsumerWidget {
  const TripSummaryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final course = ref.watch(courseProvider).course;
    if (course == null) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Course terminée'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
        automaticallyImplyLeading: false,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Column(
                children: [
                  const Icon(Icons.check_circle, color: AppColors.success, size: 64),
                  const SizedBox(height: 12),
                  Text('Trajet terminé', style: AppTextStyles.titleLarge),
                ],
              ),
            ),
            const SizedBox(height: 24),
            SectionCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _Ligne('Départ', course.adresseDepart),
                  const SizedBox(height: 8),
                  _Ligne('Arrivée', course.adresseArrivee),
                  if (course.distanceKm != null) ...[
                    const SizedBox(height: 8),
                    _Ligne('Distance', '${course.distanceKm!.toStringAsFixed(1)} km'),
                  ],
                  const Divider(height: 32),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Montant payé', style: AppTextStyles.titleSmall),
                      Text(
                        course.tarifFinal != null ? Formatters.formatCFA(course.tarifFinal!) : '—',
                        style: AppTextStyles.titleSmall.copyWith(color: AppColors.primary),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const Spacer(),
            PrimaryButton(
              label: 'Noter le chauffeur',
              onPressed: () => context.push(Routes.rating),
            ),
          ],
        ),
      ),
    );
  }
}

class _Ligne extends StatelessWidget {
  const _Ligne(this.label, this.valeur);
  final String label;
  final String valeur;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 80,
          child: Text(label, style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary)),
        ),
        Expanded(child: Text(valeur, style: AppTextStyles.bodySmall)),
      ],
    );
  }
}
