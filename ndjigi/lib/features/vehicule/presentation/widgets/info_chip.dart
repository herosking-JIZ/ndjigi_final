import 'package:flutter/material.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';

/// Petite carte icône + libellé utilisée dans la grille 2x2 du détail véhicule.
class InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool actif;

  const InfoChip({required this.icon, required this.label, this.actif = true, super.key});

  @override
  Widget build(BuildContext context) {
    final couleurTexte = actif ? AppColors.textPrimary : AppColors.textHint;
    final couleurIcone = actif ? AppColors.primary : AppColors.textHint;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: couleurIcone),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: AppTextStyles.bodyMedium.copyWith(color: couleurTexte),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
