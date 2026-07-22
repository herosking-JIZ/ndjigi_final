import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../features/auth/presentation/providers/auth_provider.dart';
import '../../../../shared/models/utilisateur.dart';
import '../../../../shared/widgets/nav_tile.dart';
import '../../data/profile_photo_repository.dart';

class ProfilHubScreen extends ConsumerStatefulWidget {
  const ProfilHubScreen({super.key});

  @override
  ConsumerState<ProfilHubScreen> createState() => _ProfilHubScreenState();
}

class _ProfilHubScreenState extends ConsumerState<ProfilHubScreen>
    with SingleTickerProviderStateMixin {
  static const _contentMaxWidth = 720.0;

  final _imagePicker = ImagePicker();
  Uint8List? _localPhoto;
  bool _hideRemotePhoto = false;
  bool _isPhotoUpdating = false;
  double _photoProgress = 0;
  late final AnimationController _entryController;
  late final Animation<double> _fadeAnimation;
  late final Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _entryController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 450),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _entryController,
      curve: Curves.easeOutCubic,
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.06),
      end: Offset.zero,
    ).animate(_fadeAnimation);
    _entryController.forward();
  }

  @override
  void dispose() {
    _entryController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final roles = authState.availableRoles;
    final canExtend =
        !roles.contains('chauffeur') || !roles.contains('proprietaire');
    final partnerTileTitle = roles.contains('chauffeur')
        ? 'Devenir propriétaire'
        : roles.contains('proprietaire')
        ? 'Devenir partenaire chauffeur'
        : 'Devenir partenaire';

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Mon profil'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
      ),
      body: user == null
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              top: false,
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(
                      maxWidth: _contentMaxWidth,
                    ),
                    child: FadeTransition(
                      opacity: _fadeAnimation,
                      child: SlideTransition(
                        position: _slideAnimation,
                        child: Column(
                          children: [
                            _ProfileIdentityCard(
                              user: user,
                              localPhoto: _localPhoto,
                              hideRemotePhoto: _hideRemotePhoto,
                              isPhotoUpdating: _isPhotoUpdating,
                              photoProgress: _photoProgress,
                              onPhotoTap: () => _showPhotoOptions(user),
                            ),
                            const SizedBox(height: 28),
                            _ProfileSection(
                              title: 'Compte',
                              children: [
                                NavTile(
                                  icon: Icons.person_outline_rounded,
                                  title: 'Mes informations',
                                  subtitle:
                                      'Voir et modifier vos informations personnelles',
                                  onTap: () =>
                                      context.push('/profil/mes-informations'),
                                ),
                                NavTile(
                                  icon: Icons.location_on_outlined,
                                  title: 'Mes adresses',
                                  subtitle: 'Gérer vos adresses enregistrées',
                                  onTap: () =>
                                      context.push('/profil/mes-adresses'),
                                ),
                                NavTile(
                                  icon: Icons.account_balance_wallet_outlined,
                                  title: 'Portefeuille',
                                  subtitle:
                                      'Consulter votre solde et vos transactions',
                                  iconColor: AppColors.success,
                                  onTap: () =>
                                      context.push('/profil/portefeuille'),
                                ),
                              ],
                            ),
                            const SizedBox(height: 24),
                            _ProfileSection(
                              title: 'Sécurité',
                              children: [
                                NavTile(
                                  icon: Icons.shield_outlined,
                                  title: 'Sécurité & contacts',
                                  subtitle:
                                      'Sécuriser votre compte et gérer vos contacts',
                                  iconColor: AppColors.warning,
                                  onTap: () =>
                                      context.push('/profil/securite-contacts'),
                                ),
                              ],
                            ),
                            if (canExtend) ...[
                              const SizedBox(height: 24),
                              _ProfileSection(
                                title: 'Partenaire',
                                children: [
                                  NavTile(
                                    icon: Icons.directions_car_outlined,
                                    title: partnerTileTitle,
                                    subtitle:
                                        'Développer votre activité avec N’DJIGI',
                                    iconColor: AppColors.secondary,
                                    onTap: () => context.push(
                                      '/profil/devenir-partenaire',
                                    ),
                                  ),
                                ],
                              ),
                            ],
                            const SizedBox(height: 24),
                            _ProfileSection(
                              title: 'Préférences',
                              children: [
                                NavTile(
                                  icon: Icons.settings_outlined,
                                  title: 'Paramètres',
                                  subtitle:
                                      'Personnaliser les préférences de l’application',
                                  onTap: () =>
                                      context.push('/profil/parametres'),
                                ),
                              ],
                            ),
                            const SizedBox(height: 32),
                            _LogoutButton(onPressed: _logout),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 4,
        onTap: (index) {
          if (index != 4) {
            switch (index) {
              case 0:
                context.go('/home/passager');
              case 1:
                context.push('/trajets');
              case 2:
                context.push('/messages');
              case 3:
                context.push('/notifications');
            }
          }
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Accueil'),
          BottomNavigationBarItem(
            icon: Icon(Icons.directions_car),
            label: 'Trajets',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.mail), label: 'Messages'),
          BottomNavigationBarItem(
            icon: Icon(Icons.notifications),
            label: 'Notifications',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profil'),
        ],
      ),
    );
  }

  Future<void> _showPhotoOptions(Utilisateur user) async {
    if (_isPhotoUpdating) return;
    final hasPhoto =
        _localPhoto != null ||
        (!_hideRemotePhoto && (user.photoProfil?.isNotEmpty ?? false));

    await showModalBottomSheet<void>(
      context: context,
      useSafeArea: true,
      showDragHandle: true,
      isScrollControlled: true,
      backgroundColor: AppColors.background,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (sheetContext) => Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          4,
          20,
          20 + MediaQuery.viewPaddingOf(sheetContext).bottom,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Photo de profil', style: AppTextStyles.titleMedium),
            const SizedBox(height: 6),
            Text(
              'Personnalisez votre compte avec une photo récente.',
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            _PhotoActionTile(
              icon: Icons.photo_camera_outlined,
              label: 'Prendre une photo',
              onTap: () {
                Navigator.pop(sheetContext);
                _pickPhoto(ImageSource.camera);
              },
            ),
            const Divider(height: 1),
            _PhotoActionTile(
              icon: Icons.photo_library_outlined,
              label: 'Choisir depuis la galerie',
              onTap: () {
                Navigator.pop(sheetContext);
                _pickPhoto(ImageSource.gallery);
              },
            ),
            if (hasPhoto) ...[
              const Divider(height: 1),
              _PhotoActionTile(
                icon: Icons.delete_outline,
                label: 'Supprimer la photo',
                color: AppColors.error,
                onTap: () {
                  Navigator.pop(sheetContext);
                  _removePhoto();
                },
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _pickPhoto(ImageSource source) async {
    final image = await _imagePicker.pickImage(
      source: source,
      imageQuality: 85,
      maxWidth: 1440,
    );
    if (image == null) return;

    setState(() {
      _isPhotoUpdating = true;
      _photoProgress = 0;
    });
    try {
      final bytes = await image.readAsBytes();
      final user = await ref
          .read(profilePhotoRepositoryProvider)
          .upload(
            image,
            onProgress: (progress) {
              if (mounted) setState(() => _photoProgress = progress);
            },
          );
      if (!mounted) return;
      ref.read(authProvider.notifier).replaceUser(user);
      setState(() {
        _localPhoto = bytes;
        _hideRemotePhoto = false;
      });
      _showPhotoSuccessMessage('Photo de profil enregistrée.');
    } catch (_) {
      if (mounted) {
        _showPhotoErrorMessage(
          'Impossible d’enregistrer la photo. Vérifiez votre connexion et réessayez.',
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isPhotoUpdating = false;
          _photoProgress = 0;
        });
      }
    }
  }

  Future<void> _removePhoto() async {
    if (_isPhotoUpdating) return;
    setState(() => _isPhotoUpdating = true);
    try {
      final user = await ref.read(profilePhotoRepositoryProvider).delete();
      if (!mounted) return;
      ref.read(authProvider.notifier).replaceUser(user);
      setState(() {
        _localPhoto = null;
        _hideRemotePhoto = true;
      });
      _showPhotoSuccessMessage('Photo de profil supprimée.');
    } catch (_) {
      if (mounted) {
        _showPhotoErrorMessage(
          'Impossible de supprimer la photo. Réessayez dans quelques instants.',
        );
      }
    } finally {
      if (mounted) setState(() => _isPhotoUpdating = false);
    }
  }

  void _showPhotoSuccessMessage(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  void _showPhotoErrorMessage(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(content: Text(message), backgroundColor: AppColors.error),
      );
  }

  Future<void> _logout() async {
    final router = GoRouter.of(context);
    await ref.read(authProvider.notifier).logout();
    if (!mounted) return;
    router.go('/login');
  }
}

class _ProfileIdentityCard extends StatelessWidget {
  const _ProfileIdentityCard({
    required this.user,
    required this.localPhoto,
    required this.hideRemotePhoto,
    required this.isPhotoUpdating,
    required this.photoProgress,
    required this.onPhotoTap,
  });

  final Utilisateur user;
  final Uint8List? localPhoto;
  final bool hideRemotePhoto;
  final bool isPhotoUpdating;
  final double photoProgress;
  final VoidCallback onPhotoTap;

  @override
  Widget build(BuildContext context) {
    final initials = _getInitials(user.prenom, user.nom);
    final fullName = '${user.prenom ?? ''} ${user.nom ?? ''}'.trim();
    final status = _AccountStatus.fromValue(user.statutCompte);

    return Stack(
      clipBehavior: Clip.none,
      alignment: Alignment.topCenter,
      children: [
        Container(
          margin: const EdgeInsets.only(top: 46),
          width: double.infinity,
          padding: const EdgeInsets.fromLTRB(20, 66, 20, 24),
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.circular(24),
            boxShadow: const [
              BoxShadow(
                color: AppColors.black12,
                blurRadius: 20,
                offset: Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            children: [
              Text(
                fullName.isEmpty ? 'Utilisateur N’DJIGI' : fullName,
                style: AppTextStyles.titleLarge,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 6),
              Text(
                user.numeroTelephone?.isNotEmpty == true
                    ? user.numeroTelephone!
                    : 'Numéro non renseigné',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 7,
                ),
                decoration: BoxDecoration(
                  color: status.color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 7,
                      height: 7,
                      decoration: BoxDecoration(
                        color: status.color,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 7),
                    Text(
                      status.label,
                      style: AppTextStyles.labelSmall.copyWith(
                        color: status.color,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        _ProfileAvatar(
          initials: initials,
          localPhoto: localPhoto,
          remotePhoto: hideRemotePhoto ? null : user.photoProfil,
          isUpdating: isPhotoUpdating,
          progress: photoProgress,
          onTap: onPhotoTap,
        ),
      ],
    );
  }

  static String _getInitials(String? firstName, String? lastName) {
    final first = firstName?.trim();
    final last = lastName?.trim();
    final firstInitial = first?.isNotEmpty == true ? first![0] : '';
    final lastInitial = last?.isNotEmpty == true ? last![0] : '';
    final initials = '$firstInitial$lastInitial'.toUpperCase();
    return initials.isEmpty ? '?' : initials;
  }
}

class _ProfileAvatar extends StatelessWidget {
  const _ProfileAvatar({
    required this.initials,
    required this.localPhoto,
    required this.remotePhoto,
    required this.isUpdating,
    required this.progress,
    required this.onTap,
  });

  final String initials;
  final Uint8List? localPhoto;
  final String? remotePhoto;
  final bool isUpdating;
  final double progress;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final imageKey = localPhoto != null
        ? const ValueKey('local-photo')
        : ValueKey(remotePhoto ?? 'initials');

    return Semantics(
      button: true,
      label: 'Modifier la photo de profil',
      child: InkResponse(
        onTap: onTap,
        radius: 64,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              width: 104,
              height: 104,
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                color: AppColors.background,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.black12,
                    blurRadius: 14,
                    offset: Offset(0, 5),
                  ),
                ],
              ),
              child: ClipOval(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 280),
                  switchInCurve: Curves.easeOut,
                  child: _buildAvatarContent(imageKey),
                ),
              ),
            ),
            Positioned(
              right: -2,
              bottom: 4,
              child: Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.background, width: 3),
                  boxShadow: const [
                    BoxShadow(color: AppColors.black12, blurRadius: 8),
                  ],
                ),
                child: const Icon(
                  Icons.photo_camera_outlined,
                  color: Colors.white,
                  size: 17,
                ),
              ),
            ),
            if (isUpdating)
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.45),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: CircularProgressIndicator(
                      value: progress > 0 && progress < 1 ? progress : null,
                      color: Colors.white,
                      strokeWidth: 3,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildAvatarContent(Key key) {
    if (localPhoto != null) {
      return Image.memory(
        localPhoto!,
        key: key,
        fit: BoxFit.cover,
        width: double.infinity,
        height: double.infinity,
      );
    }
    if (remotePhoto?.isNotEmpty == true) {
      return Image.network(
        remotePhoto!,
        key: key,
        fit: BoxFit.cover,
        width: double.infinity,
        height: double.infinity,
        errorBuilder: (_, _, _) => _InitialsAvatar(initials: initials),
      );
    }
    return _InitialsAvatar(key: key, initials: initials);
  }
}

class _InitialsAvatar extends StatelessWidget {
  const _InitialsAvatar({required this.initials, super.key});

  final String initials;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: AppColors.primary.withValues(alpha: 0.12),
      child: Center(
        child: Text(
          initials,
          style: AppTextStyles.headlineSmall.copyWith(
            color: AppColors.primaryDark,
          ),
        ),
      ),
    );
  }
}

class _ProfileSection extends StatelessWidget {
  const _ProfileSection({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 10),
          child: Text(
            title,
            style: AppTextStyles.labelLarge.copyWith(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        Card(
          margin: EdgeInsets.zero,
          elevation: 0,
          color: AppColors.background,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: BorderSide(color: AppColors.border.withValues(alpha: 0.7)),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              for (var index = 0; index < children.length; index++) ...[
                if (index > 0)
                  const Divider(height: 1, indent: 72, endIndent: 12),
                children[index],
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _PhotoActionTile extends StatelessWidget {
  const _PhotoActionTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color = AppColors.primary,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      leading: Icon(icon, color: color),
      title: Text(
        label,
        style: AppTextStyles.bodyMedium.copyWith(
          color: color == AppColors.error ? color : AppColors.textPrimary,
          fontWeight: FontWeight.w600,
        ),
      ),
      trailing: const Icon(Icons.chevron_right, color: AppColors.textHint),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      onTap: onTap,
    );
  }
}

class _LogoutButton extends StatelessWidget {
  const _LogoutButton({required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: onPressed,
        icon: const Icon(Icons.logout_rounded),
        label: const Text('Déconnexion'),
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.error,
          side: BorderSide(color: AppColors.error.withValues(alpha: 0.35)),
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }
}

enum _AccountStatus {
  active('Compte actif', AppColors.success),
  pending('Compte en attente', AppColors.warning),
  suspended('Compte suspendu', AppColors.error),
  inactive('Compte inactif', AppColors.textSecondary);

  const _AccountStatus(this.label, this.color);

  final String label;
  final Color color;

  factory _AccountStatus.fromValue(String value) {
    return switch (value.toLowerCase()) {
      'actif' || 'active' => active,
      'en_attente' || 'en attente' || 'pending' => pending,
      'suspendu' || 'suspended' => suspended,
      _ => inactive,
    };
  }
}
