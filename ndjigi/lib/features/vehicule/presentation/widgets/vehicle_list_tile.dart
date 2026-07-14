import 'package:flutter/material.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../shared/widgets/authenticated_image.dart';
import '../../data/models/vehicule.dart';
import 'vehicule_statut_badge.dart';

/// Ligne "Ma flotte" : miniature + marque/modèle + immatriculation + statut + chevron.
class VehicleListTile extends StatelessWidget {
  final Vehicule vehicule;
  final String? photoUrl;
  final VoidCallback onTap;

  const VehicleListTile({
    required this.vehicule,
    this.photoUrl,
    required this.onTap,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: SizedBox(
                width: 56,
                height: 56,
                child: photoUrl != null
                    ? AuthenticatedImage(
                        url: photoUrl!,
                        fit: BoxFit.cover,
                        placeholderBuilder: (_) => _placeholder(),
                      )
                    : _placeholder(),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${vehicule.marque} ${vehicule.modele}',
                    style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    vehicule.immatriculation,
                    style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 6),
                  VehiculeStatutBadge(statut: vehicule.statut),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.textSecondary),
          ],
        ),
      ),
    );
  }

  Widget _placeholder() {
    return Container(
      color: AppColors.surface,
      child: const Icon(Icons.directions_car, color: AppColors.textSecondary),
    );
  }
}
