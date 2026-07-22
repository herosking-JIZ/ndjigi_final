import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../../shared/widgets/section_card.dart';
import '../../../../shared/widgets/nav_tile.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../auth/presentation/widgets/avatar_switcher.dart';
import '../../../notifications/presentation/providers/notification_provider.dart';
import '../providers/chauffeur_home_provider.dart';
import '../widgets/carrousel_pub.dart';
import '../widgets/portefeuille_card_chauffeur.dart';
import '../widgets/disponibilite_switch.dart';
import '../widgets/mission_card.dart';

class ChauffeurHomeScreen extends ConsumerStatefulWidget {
  const ChauffeurHomeScreen({super.key});

  @override
  ConsumerState<ChauffeurHomeScreen> createState() =>
      _ChauffeurHomeScreenState();
}

class _ChauffeurHomeScreenState extends ConsumerState<ChauffeurHomeScreen> {
  Future<void>? _refreshFuture;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(notificationProvider.notifier).loadNotifications();
      _initialiser();
    });
  }

  Future<void> _initialiser() async {
    await ref.read(chauffeurHomeProvider.notifier).initialiser();
    if (!mounted) return;
    final course = ref.read(chauffeurHomeProvider).courseActive;
    final idTrajet = course?['id_trajet'] as String?;
    if (idTrajet != null) context.push('/chauffeur/course/$idTrajet');
  }

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
        ref.read(chauffeurHomeProvider.notifier).rafraichir(),
        ref.refresh(portefeuilleCardProvider.future),
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

  Future<void> _accepterMission(MissionVtc mission) async {
    final ok = await ref
        .read(chauffeurHomeProvider.notifier)
        .accepterMission(mission);
    if (!mounted || !ok) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Vous avez accepté la course vers ${mission.destination}',
        ),
      ),
    );
    context.push('/chauffeur/course/${mission.idTrajet}');
  }

  Future<void> _refuserMission(MissionVtc mission) async {
    final ok = await ref
        .read(chauffeurHomeProvider.notifier)
        .refuserMission(mission);
    if (!mounted || !ok) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Course refusée')));
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(chauffeurHomeProvider, (previous, next) {
      if (next.errorMessage != null &&
          next.errorMessage != previous?.errorMessage) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(next.errorMessage!)));
      }
    });
    final authState = ref.watch(authProvider);
    final chauffeurState = ref.watch(chauffeurHomeProvider);
    final unreadCount = ref.watch(notificationProvider).unreadCount;
    final user = authState.user;

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: NestedScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          headerSliverBuilder: (context, innerBoxIsScrolled) => [
            SliverAppBar(
              floating: true,
              pinned: true,
              backgroundColor: AppColors.background,
              elevation: 0,
              toolbarHeight: 64,
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  color: AppColors.background,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  child: Row(
                    children: [
                      AvatarSwitcher(
                        radius: 20,
                        initials: user?.prenom?.isNotEmpty == true
                            ? user!.prenom![0].toUpperCase()
                            : '?',
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              '${user?.prenom ?? ''} ${user?.nom ?? ''}'.trim(),
                              style: AppTextStyles.titleSmall,
                            ),
                            Text(
                              chauffeurState.isOnline
                                  ? 'En ligne'
                                  : 'Hors ligne',
                              style: AppTextStyles.bodySmall.copyWith(
                                color: chauffeurState.isOnline
                                    ? AppColors.success
                                    : AppColors.error,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Stack(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.notifications_outlined),
                            color: AppColors.textPrimary,
                            onPressed: () => context.push('/notifications'),
                          ),
                          if (unreadCount > 0)
                            Positioned(
                              right: 0,
                              top: 0,
                              child: Container(
                                padding: const EdgeInsets.all(2),
                                decoration: BoxDecoration(
                                  color: AppColors.error,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                constraints: const BoxConstraints(
                                  minWidth: 16,
                                  minHeight: 16,
                                ),
                                child: Text(
                                  '$unreadCount',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
          body: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.only(bottom: 24),
            children: [
              // Carrousel pub
              const SizedBox(height: 16),
              CarrouselPub(),
              const SizedBox(height: 16),

              // Portefeuille
              PortefeuilleCardChauffeur(isOnline: chauffeurState.isOnline),
              const SizedBox(height: 16),

              // Disponibilité switch
              DisponibiliteSwitch(
                isOnline: chauffeurState.isOnline,
                onToggle: () {
                  ref
                      .read(chauffeurHomeProvider.notifier)
                      .toggleDisponibilite();
                },
              ),
              const SizedBox(height: 24),

              // Section Covoiturage
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  'Covoiturage',
                  style: AppTextStyles.titleSmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: SectionCard(
                  child: NavTile(
                    icon: Icons.people_alt_outlined,
                    title: 'Covoiturage',
                    subtitle: 'Gérer mes trajets proposés',
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Covoiturage bientôt disponible'),
                        ),
                      );
                    },
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Section Mes missions
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  'Mes missions',
                  style: AppTextStyles.titleSmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
              const SizedBox(height: 8),

              // Missions ou empty
              chauffeurState.missions.isEmpty
                  ? EmptyView(
                      icon: Icons.directions_car_outlined,
                      message: 'Aucune course pour le moment\nRestez en ligne',
                    )
                  : ListView.builder(
                      physics: const NeverScrollableScrollPhysics(),
                      shrinkWrap: true,
                      itemCount: chauffeurState.missions.length,
                      itemBuilder: (context, index) {
                        final mission = chauffeurState.missions[index];
                        return MissionCard(
                          mission: mission,
                          secondesRestantes: mission.secondesRestantes,
                          onAccepter: () => _accepterMission(mission),
                          onRefuser: () => _refuserMission(mission),
                        );
                      },
                    ),
            ],
          ),
        ),
      ),
    );
  }
}
