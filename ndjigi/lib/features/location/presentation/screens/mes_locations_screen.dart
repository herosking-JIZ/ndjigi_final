import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../providers/mes_demandes_provider.dart';
import '../widgets/demande_card.dart';

/// Écran "Mes locations" (passager) : 3 sous-onglets En attente / Actives /
/// Historique — équivalent passager de `ProprietaireLocationsHubScreen`.
class MesLocationsScreen extends StatelessWidget {
  const MesLocationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(
          title: const Text('Mes locations'),
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
            _ListeDemandes(statut: 'en_attente'),
            _ListeDemandes(statut: 'active'),
            _ListeDemandes(statut: 'historique'),
          ],
        ),
      ),
    );
  }
}

class _ListeDemandes extends ConsumerWidget {
  final String statut;

  const _ListeDemandes({required this.statut});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final demandesAsync = ref.watch(mesDemandesProvider(statut));

    return RefreshIndicator(
      onRefresh: () async => ref.refresh(mesDemandesProvider(statut).future),
      child: demandesAsync.when(
        loading: () => const LoadingView(),
        error: (error, _) => ErrorView(
          message: 'Impossible de charger vos locations.',
          onRetry: () => ref.invalidate(mesDemandesProvider(statut)),
        ),
        data: (demandes) {
          if (demandes.isEmpty) {
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
            itemCount: demandes.length,
            itemBuilder: (context, index) {
              final demande = demandes[index];
              return DemandeCard(
                demande: demande,
                onTap: () => context.push('/home/passager/location/mes-locations/${demande.idLocation}'),
              );
            },
          );
        },
      ),
    );
  }
}
