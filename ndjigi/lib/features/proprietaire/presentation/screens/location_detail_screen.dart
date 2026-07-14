import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../../shared/widgets/inline_banner.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/section_card.dart';
import '../providers/location_detail_provider.dart';

/// Détail d'une demande/location : infos véhicule, locataire, dates, montant.
/// Boutons Accepter/Refuser affichés uniquement si la demande est en attente.
/// (Aucune maquette fournie pour cet écran — conçu pour compléter le flux
/// "Détails" de l'onglet En attente.)
class LocationDetailScreen extends ConsumerWidget {
  final String idLocation;

  const LocationDetailScreen({required this.idLocation, super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locationAsync = ref.watch(locationDetailProvider(idLocation));
    final actionState = ref.watch(locationActionProvider(idLocation));

    ref.listen(locationActionProvider(idLocation), (previous, next) {
      if (next.success && (previous == null || !previous.success)) {
        Navigator.of(context).maybePop();
      }
    });

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Détail de la location'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
      ),
      body: locationAsync.when(
        loading: () => const LoadingView(),
        error: (error, _) => ErrorView(
          message: 'Impossible de charger cette location.',
          onRetry: () => ref.invalidate(locationDetailProvider(idLocation)),
        ),
        data: (location) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SectionCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Véhicule', style: AppTextStyles.labelLarge.copyWith(color: AppColors.textSecondary)),
                    const SizedBox(height: 4),
                    Text(
                      '${location.vehicule.nomComplet} · ${location.vehicule.immatriculation ?? ''}',
                      style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              SectionCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Locataire', style: AppTextStyles.labelLarge.copyWith(color: AppColors.textSecondary)),
                    const SizedBox(height: 4),
                    Text(location.passager.nomComplet, style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w600)),
                    if (location.passager.numeroTelephone != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        location.passager.numeroTelephone!,
                        style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 16),
              SectionCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (location.dateDebut != null && location.dateFin != null) ...[
                      _ligne('Période', '${Formatters.formatDate(location.dateDebut!)} → '
                          '${Formatters.formatDate(location.dateFin!)}'),
                      const SizedBox(height: 8),
                    ],
                    _ligne(
                      'Montant',
                      location.montantTotal != null ? Formatters.formatCFA(location.montantTotal!) : '-',
                    ),
                  ],
                ),
              ),
              if (actionState.errorMessage != null) ...[
                const SizedBox(height: 16),
                InlineBanner(
                  message: actionState.errorMessage!,
                  color: AppColors.error,
                  icon: Icons.error_outline,
                ),
              ],
              if (location.statut == 'en_attente') ...[
                const SizedBox(height: 24),
                PrimaryButton(
                  label: 'Accepter',
                  isLoading: actionState.isSubmitting,
                  onPressed: () => ref.read(locationActionProvider(idLocation).notifier).accepter(),
                ),
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: actionState.isSubmitting
                      ? null
                      : () => ref.read(locationActionProvider(idLocation).notifier).refuser(),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(52),
                    foregroundColor: AppColors.error,
                    side: const BorderSide(color: AppColors.error),
                  ),
                  child: const Text('Refuser'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _ligne(String label, String valeur) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary)),
        Text(valeur, style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
      ],
    );
  }
}
