import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../vehicule/data/vehicule_repository.dart';
import '../providers/recherche_vehicules_provider.dart';
import '../widgets/date_range_picker_field.dart';
import '../widgets/vehicule_location_card.dart';

/// Écran "Location" côté passager : recherche des véhicules disponibles,
/// filtrable par catégorie et par période.
class RechercheVehiculesScreen extends ConsumerWidget {
  const RechercheVehiculesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(rechercheVehiculesProvider);
    final notifier = ref.read(rechercheVehiculesProvider.notifier);
    final categoriesAsync = ref.watch(categoriesVehiculeLocationProvider);
    final vehiculeRepository = ref.read(vehiculeRepositoryProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Louer un véhicule'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                DateRangePickerField(
                  value: state.periode,
                  onChanged: notifier.definirPeriode,
                ),
                const SizedBox(height: 12),
                categoriesAsync.when(
                  loading: () => const SizedBox.shrink(),
                  error: (_, _) => const SizedBox.shrink(),
                  data: (categories) => SizedBox(
                    height: 36,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: [
                        _chipCategorie(
                          label: 'Toutes',
                          selectionne: state.idCategorie == null,
                          onTap: () => notifier.definirCategorie(null),
                        ),
                        const SizedBox(width: 8),
                        for (final categorie in categories) ...[
                          _chipCategorie(
                            label: categorie.nom,
                            selectionne: state.idCategorie == categorie.idCategorie,
                            onTap: () => notifier.definirCategorie(categorie.idCategorie),
                          ),
                          const SizedBox(width: 8),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: notifier.rechercher,
              child: _buildContenu(state, vehiculeRepository, () => notifier.rechercher(), context),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContenu(
    RechercheVehiculesState state,
    VehiculeRepository vehiculeRepository,
    VoidCallback onRetry,
    BuildContext context,
  ) {
    if (state.isLoading && state.resultats.isEmpty) {
      return const LoadingView();
    }
    if (state.errorMessage != null && state.resultats.isEmpty) {
      return ErrorView(message: state.errorMessage!, onRetry: onRetry);
    }
    if (state.resultats.isEmpty) {
      return ListView(
        children: const [
          SizedBox(height: 80),
          EmptyView(
            icon: Icons.directions_car_outlined,
            message: 'Aucun véhicule disponible pour ces critères',
          ),
        ],
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: state.resultats.length,
      itemBuilder: (context, index) {
        final vehicule = state.resultats[index];
        return VehiculeLocationCard(
          vehicule: vehicule,
          photoUrl: vehicule.photoPrincipale != null ? vehiculeRepository.urlPhoto(vehicule.photoPrincipale!) : null,
          onTap: () => context.push('/home/passager/location/${vehicule.idVehicule}'),
        );
      },
    );
  }

  Widget _chipCategorie({required String label, required bool selectionne, required VoidCallback onTap}) {
    return ChoiceChip(
      label: Text(label, style: AppTextStyles.labelLarge),
      selected: selectionne,
      onSelected: (_) => onTap(),
      selectedColor: AppColors.primary.withValues(alpha: 0.15),
      labelStyle: AppTextStyles.labelLarge.copyWith(
        color: selectionne ? AppColors.primary : AppColors.textSecondary,
      ),
    );
  }
}
