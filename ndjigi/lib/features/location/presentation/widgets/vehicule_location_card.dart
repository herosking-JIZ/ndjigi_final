import 'package:flutter/material.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../shared/widgets/authenticated_image.dart';
import '../../data/models/vehicule_location_resume.dart';

/// Tuile résultat de recherche : photo + marque/modèle + tarif par jour.
class VehiculeLocationCard extends StatelessWidget {
  final VehiculeLocationResume vehicule;
  final String? photoUrl;
  final VoidCallback? onTap;

  const VehiculeLocationCard({
    required this.vehicule,
    this.photoUrl,
    this.onTap,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: AppColors.background,
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.horizontal(
                left: Radius.circular(12),
              ),
              child: SizedBox(
                width: 100,
                height: 112,
                child: photoUrl != null
                    ? AuthenticatedImage(
                        url: photoUrl!,
                        fit: BoxFit.cover,
                        placeholderBuilder: (_) => _placeholder(),
                      )
                    : _placeholder(),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      vehicule.nomComplet,
                      style: AppTextStyles.bodyLarge.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (vehicule.annee != null || vehicule.couleur != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        [
                          if (vehicule.annee != null) '${vehicule.annee}',
                          ?vehicule.couleur,
                        ].join(' · '),
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                    const SizedBox(height: 8),
                    Text(
                      vehicule.tarifParJourLocation != null
                          ? '${Formatters.formatCFA(vehicule.tarifParJourLocation!)} / jour'
                          : 'Tarif non défini',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.success,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _placeholder() {
    return Container(
      color: AppColors.surfaceVariant,
      child: const Center(
        child: Icon(
          Icons.directions_car,
          size: 32,
          color: AppColors.textSecondary,
        ),
      ),
    );
  }
}
