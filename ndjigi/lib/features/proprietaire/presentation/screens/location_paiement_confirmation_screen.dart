import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/section_card.dart';
import '../../data/models/location_acceptation_result.dart';

/// Confirmation affichée juste après l'acceptation d'une demande de
/// location : le paiement (débit locataire / crédit propriétaire net de
/// commission) vient d'avoir lieu côté backend, ce récap en informe le
/// propriétaire sans nouvel appel réseau (les montants viennent de la
/// réponse de PATCH /locations/:id/accepter, passée via `extra`).
class LocationPaiementConfirmationScreen extends StatelessWidget {
  final String idLocation;
  final LocationAcceptationResult? resultat;

  const LocationPaiementConfirmationScreen({required this.idLocation, this.resultat, super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Location acceptée'),
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
                  Text('Demande acceptée', style: AppTextStyles.titleLarge),
                  const SizedBox(height: 4),
                  Text(
                    'Le paiement a été prélevé sur le portefeuille du locataire.',
                    style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            SectionCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _ligne('Montant total', resultat?.montantTotal),
                  const SizedBox(height: 8),
                  _ligne('Commission plateforme', resultat?.commission),
                  const Divider(height: 32),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Montant crédité', style: AppTextStyles.titleSmall),
                      Text(
                        resultat?.montantNet != null ? Formatters.formatCFA(resultat!.montantNet!) : '—',
                        style: AppTextStyles.titleSmall.copyWith(color: AppColors.primary),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const Spacer(),
            if (resultat?.idConversation != null) ...[
              PrimaryButton(
                label: 'Discuter avec le locataire',
                onPressed: () => context.push('/chat/${resultat!.idConversation}'),
              ),
              const SizedBox(height: 12),
            ],
            OutlinedButton(
              onPressed: () => context.go('/home/proprietaire/locations'),
              style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(52)),
              child: const Text('Retour aux locations'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _ligne(String label, double? valeur) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary)),
        Text(
          valeur != null ? Formatters.formatCFA(valeur) : '—',
          style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}
