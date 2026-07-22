import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/section_card.dart';
import '../providers/chauffeur_home_provider.dart';

class ChauffeurCourseScreen extends ConsumerStatefulWidget {
  const ChauffeurCourseScreen({required this.idTrajet, super.key});

  final String idTrajet;

  @override
  ConsumerState<ChauffeurCourseScreen> createState() =>
      _ChauffeurCourseScreenState();
}

class _ChauffeurCourseScreenState extends ConsumerState<ChauffeurCourseScreen> {
  final _pinController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(chauffeurHomeProvider.notifier).chargerCourse(widget.idTrajet);
    });
  }

  @override
  void dispose() {
    _pinController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(chauffeurHomeProvider);
    final course = state.courseActive;
    final correspond = course?['id_trajet'] == widget.idTrajet;

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Course VTC'),
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
      ),
      body: !correspond
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => ref
                  .read(chauffeurHomeProvider.notifier)
                  .chargerCourse(widget.idTrajet),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  SectionCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _Adresse(
                          icon: Icons.trip_origin,
                          label: course?['adresse_depart'] as String? ?? '—',
                          color: AppColors.success,
                        ),
                        const SizedBox(height: 16),
                        _Adresse(
                          icon: Icons.location_on,
                          label: course?['adresse_arrivee'] as String? ?? '—',
                          color: AppColors.error,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  SectionCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Passager',
                          style: AppTextStyles.labelSmall.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          course?['passager_nom'] as String? ?? '—',
                          style: AppTextStyles.titleSmall,
                        ),
                        const Divider(height: 28),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '${course?['distance_km'] ?? '—'} km',
                              style: AppTextStyles.bodyMedium,
                            ),
                            Text(
                              '${course?['tarif_final'] ?? '—'} FCFA',
                              style: AppTextStyles.titleSmall.copyWith(
                                color: AppColors.primary,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  if (course?['id_conversation'] != null) ...[
                    OutlinedButton.icon(
                      onPressed: () =>
                          context.push('/chat/${course?['id_conversation']}'),
                      icon: const Icon(Icons.chat_bubble_outline),
                      label: const Text('Écrire au passager'),
                    ),
                    const SizedBox(height: 16),
                  ],
                  if (state.errorMessage != null) ...[
                    Text(
                      state.errorMessage!,
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.error,
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                  _actions(context, state, course!),
                ],
              ),
            ),
    );
  }

  Widget _actions(
    BuildContext context,
    ChauffeurHomeState state,
    Map<String, dynamic> course,
  ) {
    final statut = course['statut'] as String? ?? '';
    final confirmationChauffeur =
        course['confirmation_chauffeur'] as bool? ?? false;
    final arrive = course['chauffeur_arrive_a'] != null;
    final notifier = ref.read(chauffeurHomeProvider.notifier);

    if (statut == 'chauffeur_trouve' && !confirmationChauffeur) {
      return PrimaryButton(
        label: 'Confirmer la prise en charge',
        isLoading: state.isCourseActionLoading,
        onPressed: notifier.confirmerCourse,
      );
    }
    if (statut == 'chauffeur_trouve') {
      return const _Information(
        texte: 'En attente de la confirmation du passager.',
      );
    }
    if (statut == 'confirme' && !arrive) {
      return PrimaryButton(
        label: 'Je suis arrivé',
        isLoading: state.isCourseActionLoading,
        onPressed: notifier.signalerArrivee,
      );
    }
    if (statut == 'confirme') {
      return Column(
        children: [
          TextField(
            controller: _pinController,
            keyboardType: TextInputType.number,
            textAlign: TextAlign.center,
            maxLength: 4,
            onChanged: (_) => setState(() {}),
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            decoration: const InputDecoration(
              labelText: 'PIN communiqué par le passager',
              hintText: '0000',
              counterText: '',
            ),
          ),
          const SizedBox(height: 12),
          PrimaryButton(
            label: 'Vérifier le PIN et démarrer',
            isLoading: state.isCourseActionLoading,
            isDisabled: _pinController.text.length != 4,
            onPressed: () async {
              await notifier.demarrerCourse(_pinController.text);
              if (mounted) setState(() {});
            },
          ),
        ],
      );
    }
    if (statut == 'en_cours') {
      return PrimaryButton(
        label: 'Terminer la course',
        isLoading: state.isCourseActionLoading,
        onPressed: () async {
          final confirme = await showDialog<bool>(
            context: context,
            builder: (context) => AlertDialog(
              title: const Text('Terminer la course ?'),
              content: const Text(
                'Confirmez uniquement lorsque le passager est arrivé à destination.',
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: const Text('Retour'),
                ),
                TextButton(
                  onPressed: () => Navigator.pop(context, true),
                  child: const Text('Terminer'),
                ),
              ],
            ),
          );
          if (confirme == true) await notifier.terminerCourse();
        },
      );
    }
    if (statut == 'termine' || statut == 'annule') {
      return PrimaryButton(
        label: 'Retour à l’accueil',
        onPressed: () => context.go('/home/chauffeur'),
      );
    }
    return _Information(texte: 'État de la course : $statut');
  }
}

class _Adresse extends StatelessWidget {
  const _Adresse({
    required this.icon,
    required this.label,
    required this.color,
  });

  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Icon(icon, color: color, size: 20),
      const SizedBox(width: 10),
      Expanded(child: Text(label, style: AppTextStyles.bodyMedium)),
    ],
  );
}

class _Information extends StatelessWidget {
  const _Information({required this.texte});

  final String texte;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: AppColors.info.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Text(texte, textAlign: TextAlign.center),
  );
}
