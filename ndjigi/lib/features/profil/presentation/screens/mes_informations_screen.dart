import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/providers/app_providers.dart';
import '../../../../core/theme/colors.dart';
import '../../../../features/auth/presentation/providers/auth_provider.dart';
import '../../../../shared/widgets/app_text_field.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/section_card.dart';

class MesInformationsScreen extends ConsumerStatefulWidget {
  const MesInformationsScreen({super.key});

  @override
  ConsumerState<MesInformationsScreen> createState() => _MesInformationsScreenState();
}

class _MesInformationsScreenState extends ConsumerState<MesInformationsScreen> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _prenomController;
  late TextEditingController _nomController;
  late TextEditingController _telephoneController;
  late TextEditingController _emailController;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    final authState = ref.read(authProvider);
    final user = authState.user;

    _prenomController = TextEditingController(text: user?.prenom ?? '');
    _nomController = TextEditingController(text: user?.nom ?? '');
    _telephoneController = TextEditingController(text: user?.numeroTelephone ?? '');
    _emailController = TextEditingController(text: user?.email ?? '');
  }

  @override
  void dispose() {
    _prenomController.dispose();
    _nomController.dispose();
    _telephoneController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _saveChanges() async {
    if (!_formKey.currentState!.validate()) return;

    if (!mounted) return;

    final messenger = ScaffoldMessenger.of(context);
    final router = GoRouter.of(context);

    setState(() => _isLoading = true);

    try {
      final apiService = ref.read(apiServiceProvider);

      await apiService.patch<Map<String, dynamic>>(
        '/utilisateurs/profil',
        data: {
          'prenom': _prenomController.text,
          'nom': _nomController.text,
          'numero_telephone': _telephoneController.text,
        },
      );

      if (!mounted) return;

      messenger.showSnackBar(
        SnackBar(
          content: const Text('Informations mises à jour'),
          backgroundColor: AppColors.success,
        ),
      );

      ref.invalidate(authProvider);
      router.pop();
    } catch (e) {
      if (!mounted) return;

      messenger.showSnackBar(
        SnackBar(
          content: Text('Erreur: ${e.toString()}'),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Mes informations'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
      ),
      body: user == null
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  SectionCard(
                    child: Form(
                      key: _formKey,
                      child: Column(
                        children: [
                          AppTextField(
                            label: 'Prénom',
                            controller: _prenomController,
                            prefixIcon: Icons.person_outline,
                            validator: (value) {
                              if (value?.isEmpty ?? true) return 'Prénom requis';
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          AppTextField(
                            label: 'Nom',
                            controller: _nomController,
                            prefixIcon: Icons.person_outline,
                            validator: (value) {
                              if (value?.isEmpty ?? true) return 'Nom requis';
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          AppTextField(
                            label: 'Téléphone',
                            controller: _telephoneController,
                            prefixIcon: Icons.phone_outlined,
                            keyboardType: TextInputType.phone,
                            validator: (value) {
                              if (value?.isEmpty ?? true) return 'Téléphone requis';
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          AppTextField(
                            label: 'Email',
                            initialValue: user.email,
                            prefixIcon: Icons.email_outlined,
                            keyboardType: TextInputType.emailAddress,
                            validator: (value) {
                              if (value?.isEmpty ?? true) return 'Email requis';
                              if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value!)) {
                                return 'Email invalide';
                              }
                              return null;
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  PrimaryButton(
                    label: 'Enregistrer',
                    isLoading: _isLoading,
                    onPressed: _saveChanges,
                  ),
                ],
              ),
            ),
    );
  }
}
