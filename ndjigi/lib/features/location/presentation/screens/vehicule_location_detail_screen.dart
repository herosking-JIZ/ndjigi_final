import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/section_card.dart';
import '../../../vehicule/data/models/vehicule.dart';
import '../../../vehicule/data/vehicule_repository.dart';
import '../../../vehicule/presentation/widgets/info_chip.dart';
import '../../../vehicule/presentation/widgets/vehicule_photo_carousel.dart';
import '../../data/models/vehicule_location_detail.dart';
import '../providers/vehicule_location_detail_provider.dart';

/// Détail public d'un véhicule de location, vu par un passager : carrousel
/// photo complet, caractéristiques, tarifs, note du propriétaire, bouton
/// "Réserver". Contrairement à `VehiculeDetailScreen` (côté propriétaire),
/// pas de bouton "Modifier" ni de bloc "Performance mensuelle".
class VehiculeLocationDetailScreen extends ConsumerWidget {
  final String idVehicule;

  const VehiculeLocationDetailScreen({required this.idVehicule, super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(vehiculeLocationDetailProvider(idVehicule));
    final photosAsync = ref.watch(photosVehiculeLocationProvider(idVehicule));
    final vehiculeRepository = ref.read(vehiculeRepositoryProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: detailAsync.when(
        loading: () => const LoadingView(),
        error: (error, _) => ErrorView(
          message: 'Impossible de charger ce véhicule.',
          onRetry: () => ref.invalidate(vehiculeLocationDetailProvider(idVehicule)),
        ),
        data: (vehicule) => _Contenu(
          vehicule: vehicule,
          photos: photosAsync.valueOrNull ?? const [],
          urlBuilder: vehiculeRepository.urlPhoto,
        ),
      ),
    );
  }
}

class _Contenu extends StatelessWidget {
  final VehiculeLocationDetail vehicule;
  final List<PhotoVehicule> photos;
  final String Function(String idPhoto) urlBuilder;

  const _Contenu({required this.vehicule, required this.photos, required this.urlBuilder});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: EdgeInsets.zero,
            children: [
              Stack(
                children: [
                  VehiculePhotoCarousel(photos: photos, urlBuilder: urlBuilder, height: 240),
                  Positioned(top: 40, left: 12, child: _boutonRetour(context)),
                ],
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(vehicule.nomComplet, style: AppTextStyles.titleLarge),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.star, size: 16, color: AppColors.warning),
                        const SizedBox(width: 4),
                        Text(
                          vehicule.noteMoyenne != null ? vehicule.noteMoyenne!.toStringAsFixed(1) : 'Nouveau',
                          style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'Proposé par ${vehicule.proprietaire.nomComplet}',
                          style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 2.6,
                      children: [
                        InfoChip(icon: Icons.event_seat_outlined, label: '${vehicule.nbPlaces} Places'),
                        InfoChip(
                          icon: Icons.ac_unit,
                          label: vehicule.climatisation ? 'Climatisé' : 'Non climatisé',
                          actif: vehicule.climatisation,
                        ),
                        InfoChip(icon: Icons.palette_outlined, label: vehicule.couleur ?? '-'),
                        InfoChip(
                          icon: Icons.gps_fixed,
                          label: vehicule.gpsActif ? 'GPS Actif' : 'GPS Inactif',
                          actif: vehicule.gpsActif,
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Text('Tarifs', style: AppTextStyles.titleSmall.copyWith(color: AppColors.textSecondary)),
                    const SizedBox(height: 12),
                    SectionCard(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _statistique(_formatMontant(vehicule.tarifBaseLocation), 'Tarif de base'),
                          _statistique(_formatMontant(vehicule.tarifParJourLocation), 'Par jour'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ],
          ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: PrimaryButton(
              label: 'Réserver',
              onPressed: () => context.push('/home/passager/location/${vehicule.idVehicule}/demande', extra: vehicule),
            ),
          ),
        ),
      ],
    );
  }

  Widget _boutonRetour(BuildContext context) {
    return Material(
      color: Colors.black.withValues(alpha: 0.4),
      shape: const CircleBorder(),
      child: IconButton(
        icon: const Icon(Icons.arrow_back, color: Colors.white),
        onPressed: () => Navigator.of(context).maybePop(),
      ),
    );
  }

  Widget _statistique(String valeur, String label) {
    return Column(
      children: [
        Text(valeur, style: AppTextStyles.titleLarge.copyWith(color: AppColors.accent)),
        const SizedBox(height: 2),
        Text(label, style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary)),
      ],
    );
  }

  String _formatMontant(double? montant) {
    if (montant == null) return 'Non défini';
    return Formatters.formatCFA(montant);
  }
}
