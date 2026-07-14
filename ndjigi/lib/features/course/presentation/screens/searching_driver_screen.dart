import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/routes.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../providers/course_provider.dart';

// ── Écran d'attente pendant le matching automatique ──────────────────

class SearchingDriverScreen extends ConsumerStatefulWidget {
  const SearchingDriverScreen({super.key});

  @override
  ConsumerState<SearchingDriverScreen> createState() => _SearchingDriverScreenState();
}

class _SearchingDriverScreenState extends ConsumerState<SearchingDriverScreen> {
  bool _navigationDeclenchee = false;

  @override
  Widget build(BuildContext context) {
    ref.listen(courseProvider, (previous, next) {
      if (_navigationDeclenchee) return;
      final statut = next.course?.statut;
      if (statut == 'chauffeur_trouve') {
        _navigationDeclenchee = true;
        context.push(Routes.driverMatching);
      } else if (statut == 'annule' && next.messageMatchingEchec != null) {
        _navigationDeclenchee = true;
      }
    });

    final state = ref.watch(courseProvider);
    final echec = state.messageMatchingEchec != null;

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Recherche de chauffeur'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
        automaticallyImplyLeading: false,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: echec
                ? [
                    Icon(Icons.search_off, size: 72, color: AppColors.textSecondary),
                    const SizedBox(height: 24),
                    Text(
                      state.messageMatchingEchec!,
                      style: AppTextStyles.titleSmall,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 32),
                    PrimaryButton(
                      label: 'Changer de catégorie',
                      onPressed: () {
                        ref.read(courseProvider.notifier).reset();
                        context.go(Routes.destinationSearch);
                      },
                    ),
                  ]
                : [
                    const CircularProgressIndicator(color: AppColors.primary),
                    const SizedBox(height: 24),
                    Text('Recherche d\'un chauffeur à proximité...', style: AppTextStyles.titleSmall),
                    const SizedBox(height: 8),
                    Text(
                      'Cela peut prendre jusqu\'à 15 minutes.',
                      style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 32),
                    TextButton(
                      onPressed: () async {
                        await ref.read(courseProvider.notifier).annuler('Annulée par le passager pendant la recherche.');
                        ref.read(courseProvider.notifier).reset();
                        if (context.mounted) context.go('/home/passager');
                      },
                      child: const Text('Annuler la recherche'),
                    ),
                  ],
          ),
        ),
      ),
    );
  }
}
