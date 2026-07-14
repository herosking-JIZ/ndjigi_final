import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../data/models/location_owner_view.dart';
import '../providers/locations_provider.dart';
import '../widgets/rental_card.dart';
import '../widgets/rental_request_card.dart';

/// Écran "Suivi des Locations" : 3 sous-onglets En attente / Actives / Historique.
class ProprietaireLocationsHubScreen extends StatelessWidget {
  const ProprietaireLocationsHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(
          title: const Text('Suivi des Locations'),
          centerTitle: true,
          elevation: 0,
          backgroundColor: AppColors.background,
          foregroundColor: AppColors.textPrimary,
          bottom: TabBar(
            labelColor: AppColors.accent,
            unselectedLabelColor: AppColors.textSecondary,
            indicatorColor: AppColors.accent,
            labelStyle: AppTextStyles.labelLarge,
            tabs: const [
              Tab(text: 'En attente'),
              Tab(text: 'Actives'),
              Tab(text: 'Historique'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            _ListeLocations(statut: 'en_attente'),
            _ListeLocations(statut: 'active'),
            _ListeLocations(statut: 'historique'),
          ],
        ),
      ),
    );
  }
}

class _ListeLocations extends ConsumerWidget {
  final String statut;

  const _ListeLocations({required this.statut});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locationsAsync = ref.watch(locationsProvider(statut));

    return RefreshIndicator(
      onRefresh: () async => ref.refresh(locationsProvider(statut).future),
      child: locationsAsync.when(
        loading: () => const LoadingView(),
        error: (error, _) => ErrorView(
          message: 'Impossible de charger les locations.',
          onRetry: () => ref.invalidate(locationsProvider(statut)),
        ),
        data: (locations) {
          if (locations.isEmpty) {
            return ListView(
              children: const [
                SizedBox(height: 80),
                EmptyView(
                  icon: Icons.event_seat_outlined,
                  message: 'Aucune location pour le moment',
                ),
              ],
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: locations.length,
            itemBuilder: (context, index) {
              final location = locations[index];
              if (statut == 'en_attente') {
                return RentalRequestCard(
                  location: location,
                  onDetails: () => context.push('/home/proprietaire/locations/${location.idLocation}'),
                );
              }
              return RentalCard(
                location: location,
                badgeLabel: _badgeLabel(location),
                badgeColor: _badgeColor(location),
                onTap: () => context.push('/home/proprietaire/locations/${location.idLocation}'),
              );
            },
          );
        },
      ),
    );
  }

  String _badgeLabel(LocationOwnerView location) {
    return switch (location.statut) {
      'active' => 'Active',
      'annulee' => 'Annulée',
      'refusee' => 'Refusée',
      _ => 'Terminée',
    };
  }

  Color _badgeColor(LocationOwnerView location) {
    return switch (location.statut) {
      'active' => AppColors.info,
      'annulee' || 'refusee' => AppColors.error,
      _ => AppColors.success,
    };
  }
}
