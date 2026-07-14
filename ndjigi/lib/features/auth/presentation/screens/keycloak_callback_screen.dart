import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';

class KeycloakCallbackScreen extends ConsumerStatefulWidget {
  final String? code;
  final String? state;
  final String? error;

  const KeycloakCallbackScreen({
    this.code,
    this.state,
    this.error,
    super.key,
  });

  @override
  ConsumerState<KeycloakCallbackScreen> createState() =>
      _KeycloakCallbackScreenState();
}

class _KeycloakCallbackScreenState
    extends ConsumerState<KeycloakCallbackScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => _handleCallback());
  }

  Future<void> _handleCallback() async {
    print('🔵 NDJIGI-AUTH: [CALLBACK-SCREEN] déclenché, code=${widget.code}');
    // Gérer les erreurs Keycloak
    if (widget.error != null && widget.error!.isNotEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erreur: ${widget.error}'),
          backgroundColor: Colors.red,
        ),
      );
      if (!mounted) return;
      context.go('/login');
      return;
    }

    // Vérifier que nous avons un code
    if (widget.code == null || widget.code!.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Code d\'authentification manquant'),
          backgroundColor: Colors.red,
        ),
      );
      if (!mounted) return;
      context.go('/login');
      return;
    }

    // Récupérer le notifier et le codeVerifier stocké
    try {
      final notifier = ref.read(authProvider.notifier);

      // Le codeVerifier devrait être stocké après startKeycloakLogin
      // Nous allons chercher à le récupérer du notifier
      // Pour simplifier, nous appelons une fonction qui le récupère

      // Compléter le login avec le code reçu
      // Le codeVerifier est récupéré automatiquement du notifier
      await notifier.completeKeycloakLogin(
        code: widget.code!,
      );

      if (!mounted) return;

      // Ajouter un listener pour détecter phoneRequired
      ref.listenManual(authProvider, (previous, next) {
        if (!mounted) return;

        if (next.phoneRequired) {
          print('🔵 NDJIGI-AUTH: [CALLBACK-SCREEN] phoneRequired=true, navigation vers /phone-collection');
          context.go('/phone-collection');
        } else if (next.isAuthenticated) {
          print('🔵 NDJIGI-AUTH: [CALLBACK-SCREEN] isAuthenticated=true, navigation vers /home');
          context.go('/home');
        } else if (next.errorMessage != null && !next.isLoading) {
          print('🔵 NDJIGI-AUTH: [CALLBACK-SCREEN] erreur: ${next.errorMessage}');
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(next.errorMessage!),
              backgroundColor: Colors.red,
            ),
          );
          context.go('/login');
        }
      });

      final newAuthState = ref.read(authProvider);
      if (newAuthState.phoneRequired) {
        if (!mounted) return;
        context.go('/phone-collection');
      } else if (!newAuthState.isAuthenticated && newAuthState.errorMessage != null) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(newAuthState.errorMessage ?? 'Erreur d\'authentification'),
            backgroundColor: Colors.red,
          ),
        );
        context.go('/login');
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erreur: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
      if (!mounted) return;
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Connexion en cours...')),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Authentification en cours...'),
          ],
        ),
      ),
    );
  }
}
