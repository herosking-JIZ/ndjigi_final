import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../providers/course_provider.dart';

// ── Notation du chauffeur en fin de course ───────────────────────────

class RatingScreen extends ConsumerStatefulWidget {
  const RatingScreen({super.key});

  @override
  ConsumerState<RatingScreen> createState() => _RatingScreenState();
}

class _RatingScreenState extends ConsumerState<RatingScreen> {
  int _note = 5;
  final _commentaireController = TextEditingController();
  bool _envoiEnCours = false;

  @override
  void dispose() {
    _commentaireController.dispose();
    super.dispose();
  }

  Future<void> _envoyer() async {
    setState(() => _envoiEnCours = true);
    final succes = await ref.read(courseProvider.notifier).noterChauffeur(
          note: _note,
          commentaire: _commentaireController.text,
        );
    if (!mounted) return;
    setState(() => _envoiEnCours = false);

    ref.read(courseProvider.notifier).reset();
    if (!mounted) return;
    if (succes) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Merci pour votre note !')),
      );
    }
    context.go('/home/passager');
  }

  @override
  Widget build(BuildContext context) {
    final course = ref.watch(courseProvider).course;

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Noter le chauffeur'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
        automaticallyImplyLeading: false,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 16),
            CircleAvatar(
              radius: 40,
              backgroundColor: AppColors.primary.withValues(alpha: 0.12),
              backgroundImage: course?.chauffeurPhoto != null ? NetworkImage(course!.chauffeurPhoto!) : null,
              child: course?.chauffeurPhoto == null
                  ? const Icon(Icons.person, size: 40, color: AppColors.primary)
                  : null,
            ),
            const SizedBox(height: 12),
            Center(child: Text(course?.chauffeurNom ?? '', style: AppTextStyles.titleMedium)),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (index) {
                final valeur = index + 1;
                return IconButton(
                  iconSize: 40,
                  icon: Icon(
                    valeur <= _note ? Icons.star : Icons.star_border,
                    color: AppColors.accent,
                  ),
                  onPressed: () => setState(() => _note = valeur),
                );
              }),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _commentaireController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'Un commentaire (facultatif)',
                filled: true,
                fillColor: AppColors.surface,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: 24),
            PrimaryButton(label: 'Envoyer', isLoading: _envoiEnCours, onPressed: _envoyer),
          ],
        ),
      ),
    );
  }
}
