import 'package:flutter/material.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../core/utils/formatters.dart';
import '../../../course/data/models/course.dart';

class HistoriqueCard extends StatelessWidget {
  final Course item;
  final VoidCallback? onTap;

  const HistoriqueCard({required this.item, this.onTap, super.key});

  @override
  Widget build(BuildContext context) {
    final isVtc = item.typeTrajet == 'vtc';
    final isTermine = item.statut == 'termine';
    final statutColor = isTermine ? AppColors.success : AppColors.error;
    final date = item.dateHeureFin ?? item.dateHeureDebut;

    return InkWell(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (date != null)
                    Text(
                      Formatters.formatDateTime(date),
                      style: AppTextStyles.labelMedium.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  const SizedBox(height: 6),
                  Text(
                    '${item.adresseDepart} → ${item.adresseArrivee}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTextStyles.bodyMedium,
                  ),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 8,
                    children: [
                      _Badge(
                        texte: isVtc ? 'VTC' : 'Covoiturage',
                        couleur: isVtc ? AppColors.info : AppColors.accent,
                      ),
                      _Badge(
                        texte: isTermine ? 'Terminé' : 'Annulé',
                        couleur: statutColor,
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Text(
              item.tarifFinal == null
                  ? '—'
                  : '+${Formatters.formatCFA(item.tarifFinal!)}',
              style: AppTextStyles.titleSmall.copyWith(
                color: isTermine ? AppColors.success : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.texte, required this.couleur});
  final String texte;
  final Color couleur;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
    decoration: BoxDecoration(
      color: couleur.withValues(alpha: 0.12),
      borderRadius: BorderRadius.circular(6),
    ),
    child: Text(
      texte,
      style: AppTextStyles.labelSmall.copyWith(color: couleur),
    ),
  );
}
