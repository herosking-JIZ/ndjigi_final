import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../../shared/widgets/section_card.dart';
import '../../data/models/vehicule.dart';
import '../../data/vehicule_repository.dart';
import '../providers/vehicule_detail_provider.dart';
import '../widgets/info_chip.dart';
import '../widgets/vehicule_photo_carousel.dart';
import '../widgets/vehicule_statut_badge.dart';

/// Détail d'un véhicule : bannière photo, infos, documents, et (véhicules de
/// location uniquement) performance mensuelle. [basePath] détermine le
/// préfixe de route utilisé pour le bouton "Modifier" (diffère entre
/// chauffeur et propriétaire).
class VehiculeDetailScreen extends ConsumerWidget {
  final String idVehicule;
  final String basePath;

  const VehiculeDetailScreen({
    required this.idVehicule,
    this.basePath = '/home/proprietaire/vehicule',
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(vehiculeDetailProvider(idVehicule));

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: detailAsync.when(
        loading: () => const LoadingView(),
        error: (error, _) => ErrorView(
          message: 'Impossible de charger ce véhicule.',
          onRetry: () => ref.invalidate(vehiculeDetailProvider(idVehicule)),
        ),
        data: (data) => _Contenu(data: data, basePath: basePath),
      ),
    );
  }
}

class _Contenu extends ConsumerWidget {
  final VehiculeDetailData data;
  final String basePath;

  const _Contenu({required this.data, required this.basePath});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final repository = ref.read(vehiculeRepositoryProvider);
    final vehicule = data.vehicule;

    return ListView(
      padding: EdgeInsets.zero,
      children: [
        Stack(
          children: [
            VehiculePhotoCarousel(
              photos: data.photos,
              urlBuilder: repository.urlPhoto,
              height: 220,
            ),
            Positioned(
              top: 40,
              left: 12,
              child: _boutonRetour(context),
            ),
            Positioned(
              bottom: 12,
              right: 12,
              child: VehiculeStatutBadge(statut: vehicule.statut),
            ),
          ],
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${vehicule.marque} ${vehicule.modele}',
                          style: AppTextStyles.titleLarge,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          vehicule.immatriculation,
                          style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.accent.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.edit_outlined, color: AppColors.accent),
                      onPressed: () => context.push('$basePath/${vehicule.idVehicule}/modifier'),
                    ),
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
                  if (vehicule.type == 'course')
                    InfoChip(
                      icon: Icons.local_taxi_outlined,
                      label: vehicule.typeService != null && vehicule.typeService!.isNotEmpty
                          ? 'Service ${vehicule.typeService}'
                          : 'Type de service non défini',
                      actif: vehicule.typeService != null && vehicule.typeService!.isNotEmpty,
                    ),
                ],
              ),
              const SizedBox(height: 24),
              Text('Documents du véhicule', style: AppTextStyles.titleSmall.copyWith(color: AppColors.textSecondary)),
              const SizedBox(height: 12),
              SectionCard(
                child: Column(
                  children: [
                    _ligneDocument('Carte Grise', _documentDeType(data.documents, 'carte_grise')),
                    const Divider(height: 24),
                    _ligneDocument('Assurance', _documentDeType(data.documents, 'assurance')),
                  ],
                ),
              ),
              if (vehicule.type == 'location' &&
                  (vehicule.tarifBaseLocation != null || vehicule.tarifParJourLocation != null)) ...[
                const SizedBox(height: 24),
                Text('Tarifs de location', style: AppTextStyles.titleSmall.copyWith(color: AppColors.textSecondary)),
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
              ],
              if (data.performance != null) ...[
                const SizedBox(height: 24),
                Text('Performance mensuelle', style: AppTextStyles.titleSmall.copyWith(color: AppColors.textSecondary)),
                const SizedBox(height: 12),
                SectionCard(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _statistique('${data.performance!.nbLocations}', 'Locations'),
                      _statistique(
                        data.performance!.noteMoyenne != null
                            ? '${data.performance!.noteMoyenne!.toStringAsFixed(1)}/5'
                            : '-/5',
                        'Note',
                      ),
                      _statistique(_formatRevenusAbrege(data.performance!.revenus), 'Revenus'),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 24),
            ],
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

  Widget _ligneDocument(String label, DocumentVehicule? document) {
    return Row(
      children: [
        const Icon(Icons.description_outlined, color: AppColors.textSecondary),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
              const SizedBox(height: 2),
              Text(
                document?.dateExpiration != null
                    ? 'Expire le ${Formatters.formatDate(document!.dateExpiration!, pattern: 'MM/yyyy')}'
                    : 'Non ajouté',
                style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
        if (document != null)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: (document.estVerifie ? AppColors.success : AppColors.warning).withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              document.estVerifie ? 'Vérifié' : 'En attente',
              style: AppTextStyles.labelSmall.copyWith(
                color: document.estVerifie ? AppColors.success : AppColors.warning,
              ),
            ),
          ),
      ],
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

  DocumentVehicule? _documentDeType(List<DocumentVehicule> documents, String type) {
    return documents.where((d) => d.type == type).firstOrNull;
  }

  String _formatRevenusAbrege(double revenus) {
    if (revenus >= 1000) return '${(revenus / 1000).toStringAsFixed(0)}k';
    return revenus.toStringAsFixed(0);
  }

  String _formatMontant(double? montant) {
    if (montant == null) return 'Non défini';
    return Formatters.formatCFA(montant);
  }
}
