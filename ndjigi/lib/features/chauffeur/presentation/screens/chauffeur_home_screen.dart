import 'dart:async';
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
  ConsumerState<ChauffeurHomeScreen> createState() => _ChauffeurHomeScreenState();
}

class _ChauffeurHomeScreenState extends ConsumerState<ChauffeurHomeScreen> {
  late List<MissionMock> _missionsList;
  late Timer _countdownTimer;

  @override
  void initState() {
    super.initState();
    _initMissions();
    _startCountdown();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(notificationProvider.notifier).loadNotifications();
      ref.read(chauffeurHomeProvider.notifier).initialiser();
    });
  }

  void _initMissions() {
    _missionsList = List.from(ref.read(missionsMockProvider));
  }

  void _startCountdown() {
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      setState(() {
        _missionsList.removeWhere((m) => m.secondesRestantes <= 0);
        for (var mission in _missionsList) {
          mission.secondesRestantes--;
        }
      });
    });
  }

  @override
  void dispose() {
    _countdownTimer.cancel();
    super.dispose();
  }

  void _accepterMission(MissionMock mission) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Vous avez accepté la course vers ${mission.destination}',
        ),
      ),
    );
    setState(() {
      _missionsList.remove(mission);
    });
  }

  void _refuserMission(MissionMock mission) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Course refusée')),
    );
    setState(() {
      _missionsList.remove(mission);
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final chauffeurState = ref.watch(chauffeurHomeProvider);
    final unreadCount = ref.watch(notificationProvider).unreadCount;
    final user = authState.user;

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: NestedScrollView(
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
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
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
                            chauffeurState.isOnline ? 'En ligne' : 'Hors ligne',
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
                ref.read(chauffeurHomeProvider.notifier).toggleDisponibilite();
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
            _missionsList.isEmpty
                ? EmptyView(
                    icon: Icons.directions_car_outlined,
                    message:
                        'Aucune course pour le moment\nRestez en ligne',
                  )
                : ListView.builder(
                    physics: const NeverScrollableScrollPhysics(),
                    shrinkWrap: true,
                    itemCount: _missionsList.length,
                    itemBuilder: (context, index) {
                      final mission = _missionsList[index];
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
    );
  }
}
