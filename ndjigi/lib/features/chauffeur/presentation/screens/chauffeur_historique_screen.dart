import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../providers/chauffeur_historique_provider.dart';
import '../widgets/historique_card.dart';

class ChauffeurHistoriqueScreen extends ConsumerWidget {
  const ChauffeurHistoriqueScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filtreActif = ref.watch(filtreHistoriqueProvider);
    final historique = ref.watch(chauffeurHistoriqueProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Historique'),
        centerTitle: true,
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
      ),
      body: Column(
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: ['Tous', 'VTC', 'Covoiturage'].map((filtre) {
                final selectionne = filtreActif == filtre;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(filtre),
                    selected: selectionne,
                    selectedColor: AppColors.primary.withValues(alpha: 0.15),
                    labelStyle: AppTextStyles.labelMedium.copyWith(
                      color: selectionne
                          ? AppColors.primary
                          : AppColors.textSecondary,
                    ),
                    onSelected: (_) =>
                        ref.read(filtreHistoriqueProvider.notifier).state =
                            filtre,
                  ),
                );
              }).toList(),
            ),
          ),
          Expanded(
            child: historique.when(
              loading: () => const LoadingView(),
              error: (_, _) => ErrorView(
                message: 'Impossible de charger l’historique.',
                onRetry: () => ref.invalidate(chauffeurHistoriqueProvider),
              ),
              data: (courses) => courses.isEmpty
                  ? const EmptyView(
                      icon: Icons.history,
                      message: 'Aucune course dans cet historique.',
                    )
                  : RefreshIndicator(
                      onRefresh: () async =>
                          ref.invalidate(chauffeurHistoriqueProvider),
                      child: ListView.builder(
                        padding: const EdgeInsets.only(top: 8, bottom: 24),
                        itemCount: courses.length,
                        itemBuilder: (_, index) =>
                            HistoriqueCard(item: courses[index]),
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
