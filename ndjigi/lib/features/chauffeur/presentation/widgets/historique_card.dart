import 'package:flutter/material.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../providers/chauffeur_historique_provider.dart';

class HistoriqueCard extends StatelessWidget {
  final HistoriqueMock item;
  final VoidCallback? onTap;

  const HistoriqueCard({
    required this.item,
    this.onTap,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final iVtc = item.type == 'VTC';
    final typeColor = iVtc ? AppColors.info : AppColors.accent;
    final typeBgColor = iVtc
        ? AppColors.info.withValues(alpha: 0.12)
        : AppColors.accent.withValues(alpha: 0.12);

    final isTermine = item.statut == 'Terminé';
    final statutColor = isTermine ? AppColors.success : AppColors.error;

    return InkWell(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            // Colonne gauche: date, heure, trajet
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Date et heure
                  Row(
                    children: [
                      Text(
                        item.date,
                        style: AppTextStyles.labelMedium.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        item.heure,
                        style: AppTextStyles.labelMedium.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  // Trajet
                  Text(
                    '${item.depart} → ${item.arrivee}',
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  // Badges type et statut
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: typeBgColor,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          item.type,
                          style: AppTextStyles.labelSmall.copyWith(
                            color: typeColor,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: statutColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          item.statut,
                          style: AppTextStyles.labelSmall.copyWith(
                            color: statutColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            // Montant à droite
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '+${item.montant} FCFA',
                  style: AppTextStyles.titleSmall.copyWith(
                    color: AppColors.success,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                const Icon(Icons.chevron_right, color: AppColors.textSecondary),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
