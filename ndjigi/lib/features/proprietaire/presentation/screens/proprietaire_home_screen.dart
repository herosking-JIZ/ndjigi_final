import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../features/auth/presentation/providers/auth_provider.dart';
import '../../../../features/auth/presentation/widgets/avatar_switcher.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../vehicule/data/models/vehicule.dart';
import '../../../vehicule/data/vehicule_repository.dart';
import '../../../vehicule/presentation/providers/mes_vehicules_provider.dart';
import '../../../vehicule/presentation/widgets/vehicle_list_tile.dart';
import '../../../notifications/presentation/providers/notification_provider.dart';
import '../providers/locations_provider.dart';
import '../providers/proprietaire_home_provider.dart';

class ProprietaireHomeScreen extends ConsumerStatefulWidget {
  final VoidCallback onGoToLocations;

  const ProprietaireHomeScreen({required this.onGoToLocations, super.key});

  @override
  ConsumerState<ProprietaireHomeScreen> createState() =>
      _ProprietaireHomeScreenState();
}

class _ProprietaireHomeScreenState
    extends ConsumerState<ProprietaireHomeScreen> {
  Future<void>? _refreshFuture;

  Future<void> _refresh() {
    final ongoing = _refreshFuture;
    if (ongoing != null) return ongoing;
    final future = _performRefresh();
    _refreshFuture = future;
    future.whenComplete(() {
      if (identical(_refreshFuture, future)) _refreshFuture = null;
    });
    return future;
  }

  Future<void> _performRefresh() async {
    try {
      await Future.wait([
        ref.refresh(mesVehiculesProvider('location').future),
        ref.refresh(locationsProvider('en_attente').future),
        ref.refresh(locationsProvider('active').future),
        ref.refresh(locationsProvider('historique').future),
        ref.read(authProvider.notifier).refreshProfile(),
        ref.read(notificationProvider.notifier).loadNotifications(),
      ]);
      final notificationError = ref.read(notificationProvider).errorMessage;
      if (notificationError != null) throw StateError(notificationError);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Le rafraîchissement a échoué. Veuillez réessayer.'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final vehiculesAsync = ref.watch(mesVehiculesProvider('location'));
    final user = ref.watch(authProvider).user;

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: Padding(
          padding: const EdgeInsets.all(8),
          child: AvatarSwitcher(
            radius: 20,
            initials: user?.prenom?.isNotEmpty == true
                ? user!.prenom![0].toUpperCase()
                : '?',
          ),
        ),
        title: const Text('Propriétaire'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            color: AppColors.textPrimary,
            onPressed: () => context.push('/notifications'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: vehiculesAsync.when(
          loading: () => ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            children: const [SizedBox(height: 400, child: LoadingView())],
          ),
          error: (error, _) => ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            children: [
              SizedBox(
                height: 400,
                child: ErrorView(
                  message: 'Impossible de charger votre flotte.',
                  onRetry: () =>
                      ref.invalidate(mesVehiculesProvider('location')),
                ),
              ),
            ],
          ),
          data: (vehicules) => ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            children: [
              _CarteRevenus(vehicules: vehicules),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Ma flotte', style: AppTextStyles.titleMedium),
                  Text(
                    '${vehicules.length} véhicule${vehicules.length > 1 ? 's' : ''}',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (vehicules.isEmpty)
                const EmptyView(
                  icon: Icons.directions_car_outlined,
                  message: 'Aucun véhicule enregistré pour le moment',
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
                        onTap: () => context.push(
                          '/home/proprietaire/vehicule/${vehicule.idVehicule}',
                        ),
                      );
                    },
                  ),
                ),
              const SizedBox(height: 16),
              PrimaryButton(
                label: '+ Enregistrer un nouveau véhicule',
                onPressed: () =>
                    context.push('/home/proprietaire/vehicule/nouveau'),
              ),
              const SizedBox(height: 12),
              _CarteSuiviLocations(onTap: widget.onGoToLocations),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

class _CarteRevenus extends ConsumerWidget {
  final List<Vehicule> vehicules;

  const _CarteRevenus({required this.vehicules});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final visible = ref.watch(revenusVisibleProvider);
    final revenus = vehicules.fold<double>(
      0,
      (somme, v) => somme + (v.fondsGenere ?? 0),
    );

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.textPrimary,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Revenus totaux (estimés)',
                style: AppTextStyles.bodySmall.copyWith(color: Colors.white70),
              ),
              GestureDetector(
                onTap: () =>
                    ref.read(revenusVisibleProvider.notifier).state = !visible,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        visible ? Icons.visibility_off : Icons.visibility,
                        size: 14,
                        color: Colors.white,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Voir',
                        style: AppTextStyles.labelSmall.copyWith(
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            visible ? Formatters.formatCFA(revenus) : '●●●●●●● FCFA',
            style: AppTextStyles.headlineSmall.copyWith(color: Colors.white),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _statistique(
                '${ref.watch(locationsProvider('en_attente')).valueOrNull?.length ?? 0}',
                'Demandes',
              ),
              const SizedBox(width: 24),
              _statistique(
                '${ref.watch(locationsProvider('active')).valueOrNull?.length ?? 0}',
                'Actives',
              ),
              const SizedBox(width: 24),
              _statistique('${vehicules.length}', 'Flotte'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _statistique(String valeur, String label) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          valeur,
          style: AppTextStyles.titleLarge.copyWith(color: Colors.white),
        ),
        Text(
          label,
          style: AppTextStyles.bodySmall.copyWith(color: Colors.white70),
        ),
      ],
    );
  }
}

class _CarteSuiviLocations extends StatelessWidget {
  final VoidCallback onTap;

  const _CarteSuiviLocations({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.accent.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.accent.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.list_alt, color: AppColors.accent),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Suivi des Locations',
                    style: AppTextStyles.bodyLarge.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    'Demandes, actives, historique',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.textSecondary),
          ],
        ),
      ),
    );
  }
}
