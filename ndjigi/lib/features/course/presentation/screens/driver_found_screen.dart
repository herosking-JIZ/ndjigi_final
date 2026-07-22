import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/routes.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/section_card.dart';
import '../providers/course_provider.dart';

// ── Chauffeur trouvé : profil, chat (à venir) et double confirmation ──

class DriverFoundScreen extends ConsumerStatefulWidget {
  const DriverFoundScreen({super.key});

  @override
  ConsumerState<DriverFoundScreen> createState() => _DriverFoundScreenState();
}

class _DriverFoundScreenState extends ConsumerState<DriverFoundScreen> {
  bool _navigationDeclenchee = false;

  Future<void> _annuler() async {
    final motifController = TextEditingController();
    final motif = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Annuler la course'),
        content: TextField(
          controller: motifController,
          decoration: const InputDecoration(hintText: 'Motif de l\'annulation'),
          maxLines: 2,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Retour'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, motifController.text),
            child: const Text('Confirmer l\'annulation'),
          ),
        ],
      ),
    );
    if (motif == null || motif.trim().isEmpty) return;
    if (!mounted) return;
    await ref.read(courseProvider.notifier).annuler(motif.trim());
    ref.read(courseProvider.notifier).reset();
    if (mounted) context.go('/home/passager');
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(courseProvider, (previous, next) {
      if (_navigationDeclenchee) return;
      final statut = next.course?.statut;
      if (statut == 'confirme') {
        _navigationDeclenchee = true;
        context.push(Routes.tripInProgress);
      } else if (statut == 'annule') {
        _navigationDeclenchee = true;
        ref.read(courseProvider.notifier).reset();
        context.go('/home/passager');
      }
    });

    final course = ref.watch(courseProvider).course;
    if (course == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Chauffeur trouvé'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
        automaticallyImplyLeading: false,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SectionCard(
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 32,
                    backgroundColor: AppColors.primary.withValues(alpha: 0.12),
                    backgroundImage: course.chauffeurPhoto != null
                        ? NetworkImage(course.chauffeurPhoto!)
                        : null,
                    child: course.chauffeurPhoto == null
                        ? const Icon(
                            Icons.person,
                            size: 32,
                            color: AppColors.primary,
                          )
                        : null,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          course.chauffeurNom ?? '—',
                          style: AppTextStyles.titleSmall,
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(
                              Icons.star,
                              size: 16,
                              color: AppColors.accent,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              course.chauffeurNote != null
                                  ? course.chauffeurNote!.toStringAsFixed(1)
                                  : 'Nouveau',
                              style: AppTextStyles.bodySmall.copyWith(
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${course.vehiculeMarque ?? ''} ${course.vehiculeModele ?? ''} · ${course.vehiculeCouleur ?? ''}',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                        Text(
                          course.vehiculeImmatriculation ?? '',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            if (course.idConversation != null) ...[
              OutlinedButton.icon(
                onPressed: () => context.push('/chat/${course.idConversation}'),
                icon: const Icon(Icons.chat_bubble_outline),
                label: const Text('Écrire au chauffeur'),
              ),
              const SizedBox(height: 16),
            ],
            Text(
              course.confirmationPassager
                  ? (course.confirmationChauffeur
                        ? 'Les deux parties ont confirmé.'
                        : 'En attente de la confirmation du chauffeur...')
                  : 'Vérifiez les informations puis confirmez la course.',
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
            const Spacer(),
            if (!course.confirmationPassager) ...[
              PrimaryButton(
                label: 'Confirmer la course',
                onPressed: () => ref.read(courseProvider.notifier).confirmer(),
              ),
              const SizedBox(height: 12),
              TextButton(onPressed: _annuler, child: const Text('Annuler')),
            ] else ...[
              const Center(
                child: CircularProgressIndicator(color: AppColors.primary),
              ),
              const SizedBox(height: 12),
              Center(
                child: TextButton(
                  onPressed: _annuler,
                  child: const Text('Annuler'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
