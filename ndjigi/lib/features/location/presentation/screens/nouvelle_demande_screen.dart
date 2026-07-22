import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../../shared/widgets/inline_banner.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/section_card.dart';
import '../../data/models/vehicule_location_detail.dart';
import '../providers/nouvelle_demande_provider.dart';
import '../providers/vehicule_location_detail_provider.dart';
import '../widgets/date_range_picker_field.dart';

/// Formulaire "nouvelle demande de location" : choix de dates + récap
/// tarif + envoi. [vehicule] peut être transmis directement depuis l'écran
/// de détail (évite un aller-retour réseau) ; sinon il est rechargé via
/// [vehiculeLocationDetailProvider] (ex. accès par lien direct).
class NouvelleDemandeScreen extends ConsumerWidget {
  final String idVehicule;
  final VehiculeLocationDetail? vehicule;

  const NouvelleDemandeScreen({required this.idVehicule, this.vehicule, super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (vehicule != null) {
      return _Formulaire(vehicule: vehicule!);
    }

    final detailAsync = ref.watch(vehiculeLocationDetailProvider(idVehicule));
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: const Text('Nouvelle demande')),
      body: detailAsync.when(
        loading: () => const LoadingView(),
        error: (error, _) => ErrorView(
          message: 'Impossible de charger ce véhicule.',
          onRetry: () => ref.invalidate(vehiculeLocationDetailProvider(idVehicule)),
        ),
        data: (vehicule) => _Formulaire(vehicule: vehicule),
      ),
    );
  }
}

class _Formulaire extends ConsumerWidget {
  final VehiculeLocationDetail vehicule;

  const _Formulaire({required this.vehicule});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(nouvelleDemandeProvider(vehicule.idVehicule));
    final notifier = ref.read(nouvelleDemandeProvider(vehicule.idVehicule).notifier);

    ref.listen(nouvelleDemandeProvider(vehicule.idVehicule), (previous, next) {
      if (next.success && (previous == null || !previous.success)) {
        _afficherConfirmation(context);
      }
    });

    final montant = state.montantEstime(
      tarifBase: vehicule.tarifBaseLocation,
      tarifParJour: vehicule.tarifParJourLocation,
    );

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Nouvelle demande'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
      ),
      body: SingleChildScrollView(
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
                  Text(vehicule.nomComplet, style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Text('Période de location', style: AppTextStyles.titleSmall.copyWith(color: AppColors.textSecondary)),
            const SizedBox(height: 12),
            DateRangePickerField(value: state.periode, onChanged: notifier.definirPeriode),
            const SizedBox(height: 16),
            SectionCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _ligne('Tarif de base', vehicule.tarifBaseLocation != null ? Formatters.formatCFA(vehicule.tarifBaseLocation!) : '-'),
                  const SizedBox(height: 8),
                  _ligne(
                    'Tarif par jour',
                    vehicule.tarifParJourLocation != null
                        ? '${Formatters.formatCFA(vehicule.tarifParJourLocation!)} × ${state.nbJours} j'
                        : '-',
                  ),
                  const Divider(height: 24),
                  _ligne(
                    'Montant estimé',
                    montant != null ? Formatters.formatCFA(montant) : '-',
                    accent: true,
                  ),
                ],
              ),
            ),
            if (state.errorMessage != null) ...[
              const SizedBox(height: 16),
              InlineBanner(message: state.errorMessage!, color: AppColors.error, icon: Icons.error_outline),
            ],
            const SizedBox(height: 24),
            PrimaryButton(
              label: 'Envoyer la demande',
              isLoading: state.isSubmitting,
              onPressed: () => notifier.envoyer(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _ligne(String label, String valeur, {bool accent = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary)),
        Text(
          valeur,
          style: AppTextStyles.bodyLarge.copyWith(
            fontWeight: FontWeight.w700,
            color: accent ? AppColors.success : AppColors.textPrimary,
          ),
        ),
      ],
    );
  }

  void _afficherConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Demande envoyée'),
        content: const Text(
          'Votre demande a été transmise au propriétaire. Vous serez notifié dès qu\'il y répondra.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(dialogContext).pop();
              Navigator.of(context).popUntil((route) => route.settings.name == 'home-passager' || route.isFirst);
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}
