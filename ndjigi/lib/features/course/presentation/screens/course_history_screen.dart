import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../data/course_repository.dart';
import '../../data/models/course.dart';

// ── Historique des courses VTC ────────────────────────────────────────

final _historiqueProvider = FutureProvider.autoDispose<List<Course>>((ref) {
  return ref.watch(courseRepositoryProvider).getHistorique();
});

class CourseHistoryScreen extends ConsumerWidget {
  const CourseHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historique = ref.watch(_historiqueProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Mes courses'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
      ),
      body: historique.when(
        loading: () => const LoadingView(),
        error: (error, stack) => ErrorView(
          message: 'Erreur lors du chargement de l\'historique.',
          onRetry: () => ref.invalidate(_historiqueProvider),
        ),
        data: (courses) {
          if (courses.isEmpty) {
            return const EmptyView(icon: Icons.local_taxi_outlined, message: 'Aucune course pour le moment.');
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(_historiqueProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: courses.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) => _CourseTile(course: courses[index]),
            ),
          );
        },
      ),
    );
  }
}

class _CourseTile extends StatelessWidget {
  const _CourseTile({required this.course});
  final Course course;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(_libelleStatut(course.statut), style: AppTextStyles.labelSmall.copyWith(color: _couleurStatut(course.statut))),
              if (course.dateHeureDebut != null)
                Text(Formatters.formatDateTime(course.dateHeureDebut!), style: AppTextStyles.labelSmall.copyWith(color: AppColors.textSecondary)),
            ],
          ),
          const SizedBox(height: 8),
          Text(course.adresseDepart, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppTextStyles.bodySmall),
          Text(course.adresseArrivee, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppTextStyles.bodySmall),
          const SizedBox(height: 8),
          Text(
            course.tarifFinal != null ? Formatters.formatCFA(course.tarifFinal!) : '—',
            style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  String _libelleStatut(String statut) => switch (statut) {
        'termine' => 'Terminée',
        'annule' => 'Annulée',
        'en_cours' => 'En cours',
        _ => statut,
      };

  Color _couleurStatut(String statut) => switch (statut) {
        'termine' => AppColors.success,
        'annule' => AppColors.error,
        _ => AppColors.textSecondary,
      };
}
