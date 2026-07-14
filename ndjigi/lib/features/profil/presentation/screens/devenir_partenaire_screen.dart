import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../shared/widgets/inline_banner.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../enums/demande_statut.dart';
import '../enums/extension_role.dart';
import '../providers/demande_extension_provider.dart';
import '../widgets/documents_upload_section.dart';
import '../widgets/role_option_card.dart';

// ── ÉCRAN : DevenirPartennaireScreen ─────────────────────────────────
//
// Rôle : orchestration (assemblage des sections + branchement au
// provider). La présentation de chaque section vit dans ses propres
// widgets (voir enums/ et widgets/ du dossier profil, et
// shared/widgets/inline_banner.dart pour la bannière générique).

class DevenirPartennaireScreen extends ConsumerStatefulWidget {
  const DevenirPartennaireScreen({super.key});

  @override
  ConsumerState<DevenirPartennaireScreen> createState() =>
      _DevenirPartennaireScreenState();
}

class _DevenirPartennaireScreenState
    extends ConsumerState<DevenirPartennaireScreen> {
  static const _submitSuccessMessage =
      'Demande envoyée avec succès ! Elle est en cours de traitement.';
  static const _snackBarDuration = Duration(seconds: 3);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(demandeExtensionProvider.notifier).initialize();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(demandeExtensionProvider);
    final selectedRole = ExtensionRole.fromValue(state.selectedRole);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Devenir partenaire'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _RoleSelectionSection(
                    state: state,
                    selectedRole: selectedRole,
                    onSelect: (role) => ref
                        .read(demandeExtensionProvider.notifier)
                        .selectRole(role.value),
                  ),
                  if (selectedRole != null && state.hasActiveDemande) ...[
                    _ActiveDemandeBanner(state: state, role: selectedRole),
                    const SizedBox(height: 32),
                  ],
                  if (selectedRole != null && !state.hasActiveDemande)
                    DocumentsUploadSection(
                      docs: state.docs,
                      onPickFile: (docType) => ref
                          .read(demandeExtensionProvider.notifier)
                          .pickFile(docType),
                      onUpload: (docType) => ref
                          .read(demandeExtensionProvider.notifier)
                          .uploadDocument(docType),
                    ),
                  if (state.errorMessage != null) ...[
                    InlineBanner(
                      message: state.errorMessage!,
                      color: AppColors.error,
                      icon: Icons.error_outline,
                    ),
                    const SizedBox(height: 32),
                  ],
                  if (selectedRole != null && !state.hasActiveDemande)
                    _SubmitSection(state: state, onSubmit: _handleSubmit),
                  const SizedBox(height: 32),
                ],
              ),
            ),
    );
  }

  Future<void> _handleSubmit() async {
    await ref.read(demandeExtensionProvider.notifier).submitDemande();
    if (!mounted) return;

    if (ref.read(demandeExtensionProvider).submitSuccess) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(_submitSuccessMessage),
          duration: _snackBarDuration,
        ),
      );
      context.pop();
    }
  }
}

// ── Sélection du rôle ────────────────────────────────────────────────

class _RoleSelectionSection extends StatelessWidget {
  const _RoleSelectionSection({
    required this.state,
    required this.selectedRole,
    required this.onSelect,
  });

  final DemandeExtensionState state;
  final ExtensionRole? selectedRole;
  final void Function(ExtensionRole role) onSelect;

  /// Un rôle reste sélectionnable tant qu'il n'existe pas de demande
  /// active (en_attente/accepte) pour ce rôle. Une demande refusée
  /// n'empêche pas une nouvelle tentative.
  List<ExtensionRole> get _availableRoles => ExtensionRole.values.where((role) {
        return !state.existingDemandes.any(
          (d) => d.extensionType == role.value && d.statut != 'refuse',
        );
      }).toList();

  @override
  Widget build(BuildContext context) {
    final roles = _availableRoles;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quel rôle souhaitez-vous ajouter ?',
          style: AppTextStyles.titleMedium,
        ),
        const SizedBox(height: 16),
        if (roles.isEmpty)
          Text(
            'Vous avez déjà une demande en cours pour tous les rôles disponibles.',
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.textSecondary,
            ),
          )
        else
          // Row + Expanded (et non Wrap + Expanded, cf. RoleOptionCard)
          // pour que les cartes se partagent l'espace horizontal disponible.
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (var i = 0; i < roles.length; i++) ...[
                if (i > 0) const SizedBox(width: 12),
                Expanded(
                  child: RoleOptionCard(
                    role: roles[i],
                    isSelected: selectedRole == roles[i],
                    onTap: () => onSelect(roles[i]),
                  ),
                ),
              ],
            ],
          ),
        const SizedBox(height: 32),
      ],
    );
  }
}

// ── Bannière de demande active ───────────────────────────────────────

class _ActiveDemandeBanner extends StatelessWidget {
  const _ActiveDemandeBanner({required this.state, required this.role});

  final DemandeExtensionState state;
  final ExtensionRole role;

  @override
  Widget build(BuildContext context) {
    // `where(...).firstOrNull` plutôt que `firstWhere` : évite une
    // exception si, par une désynchronisation d'état transitoire,
    // aucune demande active ne correspond au rôle sélectionné.
    final matches = state.existingDemandes.where(
      (d) =>
          d.extensionType == role.value &&
          (DemandeStatut.fromValue(d.statut)?.isActive ?? false),
    );
    if (matches.isEmpty) return const SizedBox.shrink();

    final demande = matches.first;
    final statut = DemandeStatut.fromValue(demande.statut);

    // Statut backend non reconnu : bannière générique plutôt que de
    // masquer silencieusement l'information à l'utilisateur.
    if (statut == null) {
      return const InlineBanner(
        message: 'État de votre demande',
        color: AppColors.info,
        icon: Icons.info,
      );
    }

    return InlineBanner(
      message: statut.defaultMessage(motifRejet: demande.motifRejet),
      color: statut.color(context),
      icon: statut.icon,
    );
  }
}

// ── Bouton de soumission ─────────────────────────────────────────────

class _SubmitSection extends StatelessWidget {
  const _SubmitSection({required this.state, required this.onSubmit});

  final DemandeExtensionState state;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        PrimaryButton(
          label: 'Soumettre ma demande',
          isLoading: state.isSubmitting,
          isDisabled: !state.canSubmit,
          onPressed: onSubmit,
        ),
        const SizedBox(height: 12),
        if (!state.canSubmit && state.selectedRole != null)
          Text(
            'Tous les documents doivent être chargés pour soumettre.',
            style: AppTextStyles.labelSmall.copyWith(
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
      ],
    );
  }
}
