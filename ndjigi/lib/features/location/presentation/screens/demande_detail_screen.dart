import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../../shared/widgets/inline_banner.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/section_card.dart';
import '../providers/demande_detail_provider.dart';

/// Détail d'une demande de location (passager) : véhicule, propriétaire,
/// dates, montant. Bouton "Annuler" si en_attente, bouton "Discuter" dès
/// qu'une conversation existe (créée par le propriétaire à l'acceptation).
class DemandeDetailScreen extends ConsumerWidget {
  final String idLocation;

  const DemandeDetailScreen({required this.idLocation, super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final demandeAsync = ref.watch(demandeDetailProvider(idLocation));
    final actionState = ref.watch(demandeActionProvider(idLocation));

    ref.listen(demandeActionProvider(idLocation), (previous, next) {
      if (next.success && (previous == null || !previous.success)) {
        Navigator.of(context).maybePop();
      }
    });

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Détail de la demande'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
      ),
      body: demandeAsync.when(
        loading: () => const LoadingView(),
        error: (error, _) => ErrorView(
          message: 'Impossible de charger cette demande.',
          onRetry: () => ref.invalidate(demandeDetailProvider(idLocation)),
        ),
        data: (demande) => SingleChildScrollView(
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
                      '${demande.vehicule.nomComplet} · ${demande.vehicule.immatriculation ?? ''}',
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
                    Text('Propriétaire', style: AppTextStyles.labelLarge.copyWith(color: AppColors.textSecondary)),
                    const SizedBox(height: 4),
                    Text(demande.proprietaire.nomComplet, style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w600)),
                    if (demande.proprietaire.numeroTelephone != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        demande.proprietaire.numeroTelephone!,
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
                    if (demande.dateDebut != null && demande.dateFin != null) ...[
                      _ligne('Période', '${Formatters.formatDate(demande.dateDebut!)} → '
                          '${Formatters.formatDate(demande.dateFin!)}'),
                      const SizedBox(height: 8),
                    ],
                    _ligne('Montant', demande.montantTotal != null ? Formatters.formatCFA(demande.montantTotal!) : '-'),
                  ],
                ),
              ),
              if (demande.statut == 'active' || demande.statut == 'terminee') ...[
                const SizedBox(height: 16),
                InlineBanner(
                  message: 'Paiement effectué : ${demande.montantTotal != null ? Formatters.formatCFA(demande.montantTotal!) : '-'} '
                      'débités de votre portefeuille.',
                  color: AppColors.success,
                  icon: Icons.check_circle_outline,
                ),
              ],
              if (actionState.errorMessage != null) ...[
                const SizedBox(height: 16),
                InlineBanner(message: actionState.errorMessage!, color: AppColors.error, icon: Icons.error_outline),
              ],
              if (demande.idConversation != null) ...[
                const SizedBox(height: 24),
                PrimaryButton(
                  label: 'Discuter avec le propriétaire',
                  onPressed: () => context.push('/chat/${demande.idConversation}'),
                ),
              ],
              if (demande.statut == 'en_attente') ...[
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: actionState.isSubmitting
                      ? null
                      : () => ref.read(demandeActionProvider(idLocation).notifier).annuler(),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(52),
                    foregroundColor: AppColors.error,
                    side: const BorderSide(color: AppColors.error),
                  ),
                  child: actionState.isSubmitting
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Annuler la demande'),
                ),
              ],
              if (demande.statut == 'terminee' && demande.proprietaire.idUtilisateur != null) ...[
                const SizedBox(height: 12),
                PrimaryButton(
                  label: 'Noter le propriétaire',
                  onPressed: () => context.push(
                    '/home/passager/location/mes-locations/$idLocation/noter',
                    extra: demande.proprietaire.idUtilisateur,
                  ),
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
