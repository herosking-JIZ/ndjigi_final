import 'package:flutter/material.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../data/models/location_owner_view.dart';

/// Carte demande "En attente" : avatar + nom + note du locataire, lien Détails.
class RentalRequestCard extends StatelessWidget {
  final LocationOwnerView location;
  final VoidCallback onDetails;

  const RentalRequestCard({required this.location, required this.onDetails, super.key});

  @override
  Widget build(BuildContext context) {
    final passager = location.passager;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.background,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: AppColors.primary.withValues(alpha: 0.12),
            backgroundImage: passager.photoProfil != null ? NetworkImage(passager.photoProfil!) : null,
            child: passager.photoProfil == null
                ? const Icon(Icons.person, color: AppColors.primary)
                : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  passager.nomComplet,
                  style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.star, size: 14, color: AppColors.warning),
                    const SizedBox(width: 4),
                    Text(
                      (location.noteMoyenne ?? 0).toStringAsFixed(1),
                      style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ],
            ),
          ),
          TextButton.icon(
            onPressed: onDetails,
            icon: const Icon(Icons.info_outline, size: 18, color: AppColors.accent),
            label: Text('Détails', style: AppTextStyles.labelLarge.copyWith(color: AppColors.accent)),
          ),
        ],
      ),
    );
  }
}
