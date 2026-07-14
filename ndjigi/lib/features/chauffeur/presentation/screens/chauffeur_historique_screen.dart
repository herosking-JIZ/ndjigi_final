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
    final historiqueFiltree = ref.watch(historiqueFiltreeProvider);

    // Grouper par date
    final Map<String, List<HistoriqueMock>> groupedByDate = {};
    for (var item in historiqueFiltree) {
      if (!groupedByDate.containsKey(item.date)) {
        groupedByDate[item.date] = [];
      }
      groupedByDate[item.date]!.add(item);
    }

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Historique'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
        actions: [
          IconButton(
            icon: const Icon(Icons.date_range),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Filtrage par date bientôt disponible')),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Chips filtres
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: ['Tous', 'VTC', 'Covoiturage'].map((filtre) {
                final isSelected = filtreActif == filtre;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(filtre),
                    selected: isSelected,
                    selectedColor: AppColors.primary.withValues(alpha: 0.15),
                    labelStyle: AppTextStyles.labelMedium.copyWith(
                      color:
                          isSelected ? AppColors.primary : AppColors.textSecondary,
                    ),
                    onSelected: (selected) {
                      ref.read(filtreHistoriqueProvider.notifier).state = filtre;
                    },
                  ),
                );
              }).toList(),
            ),
          ),

          // Liste historique
          Expanded(
            child: historiqueFiltree.isEmpty
                ? EmptyView(
                    icon: Icons.history,
                    message: 'Aucun historique pour le moment',
                  )
                : ListView(
                    padding: const EdgeInsets.only(top: 8, bottom: 24),
                    children: groupedByDate.entries.map((entry) {
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Header date
                          Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 12,
                            ),
                            child: Text(
                              entry.key,
                              style: AppTextStyles.labelLarge.copyWith(
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ),
                          // Items pour cette date
                          ...entry.value.map((item) {
                            return HistoriqueCard(
                              item: item,
                              onTap: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Détail bientôt disponible'),
                                  ),
                                );
                              },
                            );
                          }),
                        ],
                      );
                    }).toList(),
                  ),
          ),
        ],
      ),
    );
  }
}
