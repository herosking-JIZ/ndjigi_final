import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../vehicule/data/vehicule_repository.dart';
import '../../../vehicule/presentation/providers/mes_vehicules_provider.dart';
import '../../../vehicule/presentation/widgets/vehicle_list_tile.dart';

/// "Mes véhicules" côté chauffeur : liste des véhicules de course enregistrés
/// par le chauffeur connecté (un chauffeur peut en posséder plusieurs).
class ChauffeurVehiculesScreen extends ConsumerWidget {
  const ChauffeurVehiculesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vehiculesAsync = ref.watch(mesVehiculesProvider('course'));

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Mes véhicules'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(mesVehiculesProvider('course').future),
        child: vehiculesAsync.when(
          loading: () => const LoadingView(),
          error: (error, _) => ErrorView(
            message: 'Impossible de charger vos véhicules.',
            onRetry: () => ref.invalidate(mesVehiculesProvider('course')),
          ),
          data: (vehicules) => ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Mes véhicules', style: AppTextStyles.titleMedium),
                  Text(
                    '${vehicules.length} véhicule${vehicules.length > 1 ? 's' : ''}',
                    style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (vehicules.isEmpty)
                const EmptyView(
                  icon: Icons.directions_car_outlined,
                  message: 'Enregistrez votre véhicule pour commencer à recevoir des courses',
                )
              else
                ...vehicules.map(
                  (vehicule) => Consumer(
                    builder: (context, ref, _) {
                      final repository = ref.read(vehiculeRepositoryProvider);
                      return VehicleListTile(
                        vehicule: vehicule,
                        photoUrl: vehicule.photoPrincipaleId != null
                            ? repository.urlPhoto(vehicule.photoPrincipaleId!)
                            : null,
                        onTap: () => context.push('/home/chauffeur/vehicules/${vehicule.idVehicule}'),
                      );
                    },
                  ),
                ),
              const SizedBox(height: 16),
              PrimaryButton(
                label: '+ Enregistrer un véhicule',
                onPressed: () => context.push('/home/chauffeur/vehicules/nouveau'),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
