import 'package:flutter/material.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../core/utils/formatters.dart';
import '../../data/models/location_owner_view.dart';

/// Carte location (onglets "Actives" et "Historique") : véhicule, locataire,
/// dates, montant et note. Le badge (couleur/libellé) varie selon l'onglet.
class RentalCard extends StatelessWidget {
  final LocationOwnerView location;
  final String badgeLabel;
  final Color badgeColor;
  final VoidCallback? onTap;

  const RentalCard({
    required this.location,
    required this.badgeLabel,
    required this.badgeColor,
    this.onTap,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final vehicule = location.vehicule;
    final titre = vehicule.annee != null
        ? '${vehicule.nomComplet} ${vehicule.annee}'
        : vehicule.nomComplet;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.background,
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    titre,
                    style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w600),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: badgeColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(badgeLabel, style: AppTextStyles.labelSmall.copyWith(color: badgeColor)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Locataire: ${location.passager.nomComplet}',
              style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary),
            ),
            if (location.dateDebut != null && location.dateFin != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.calendar_today_outlined, size: 14, color: AppColors.textSecondary),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      '${Formatters.formatDate(location.dateDebut!, pattern: 'd MMM yyyy')} → '
                      '${Formatters.formatDate(location.dateFin!, pattern: 'd MMM yyyy')}'
                      '${location.dureeJours != null ? ' (${location.dureeJours} j)' : ''}',
                      style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary),
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  location.montantTotal != null ? Formatters.formatCFA(location.montantTotal!) : '-',
                  style: AppTextStyles.bodyLarge.copyWith(
                    color: AppColors.success,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Row(
                  children: [
                    const Icon(Icons.star, size: 16, color: AppColors.warning),
                    const SizedBox(width: 4),
                    Text((location.noteMoyenne ?? 0).toStringAsFixed(1), style: AppTextStyles.bodyMedium),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
