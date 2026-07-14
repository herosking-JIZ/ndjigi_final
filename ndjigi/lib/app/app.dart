import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/config/app_config.dart';
import '../core/theme/app_theme.dart';
import '../core/managers/auth_failure_manager.dart';
import '../features/auth/presentation/providers/auth_provider.dart';
import 'router/app_router.dart';

class App extends ConsumerStatefulWidget {
  const App({super.key});

  @override
  ConsumerState<App> createState() => _AppState();
}

class _AppState extends ConsumerState<App> {
  final _appLinks = AppLinks();

  @override
  void initState() {
    super.initState();

    // Register auth failure callback to invalidate authProvider when refresh fails
    AuthFailureManager.instance.setOnAuthFailedCallback(() {
      ref.invalidate(authProvider);
    });

    Future.microtask(() => _initDeepLinks());
  }

  Future<void> _initDeepLinks() async {
    // ✅ Filtrer — seuls les deep links ndjigi-mobile:// sont traités ici
    // GoRouter ne doit JAMAIS recevoir ces URLs
    _appLinks.uriLinkStream.listen((uri) {
      if (uri.scheme == 'ndjigi-mobile') {
        _handleDeepLink(uri);
      }
    });

    // ✅ Deep link initial si l'app était fermée
    final initialUri = await _appLinks.getInitialLink();
    if (initialUri != null && initialUri.scheme == 'ndjigi-mobile') {
      _handleDeepLink(initialUri);
    }
  }

  void _handleDeepLink(Uri uri) {
    print('🔵 NDJIGI-AUTH: [APP-DEEPLINK] deep link reçu = ${uri.toString()}');
    print('🔵 NDJIGI-AUTH: [APP-DEEPLINK] code = ${uri.queryParameters['code']}');
    print('🔵 NDJIGI-AUTH: [APP-DEEPLINK] state = ${uri.queryParameters['state']}');

    final router = ref.read(appRouterProvider);

    if (uri.scheme == 'ndjigi-mobile' && uri.host == 'callback') {
      final code = uri.queryParameters['code'];
      final state = uri.queryParameters['state'];
      final error = uri.queryParameters['error'];

      if (code != null) {
        print('🔵 NDJIGI-AUTH: [APP-DEEPLINK] -> navigation vers keycloak-callback');
        router.go('/auth/keycloak-callback?code=$code&state=$state');
      } else if (error != null) {
        router.go('/login');
      }
    }

    if (uri.scheme == 'ndjigi-mobile' && uri.host == 'logout-callback') {
      router.go('/welcome');
    }
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: 'N\'DJIGI',
      debugShowCheckedModeBanner: AppConfig.isDebug,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light,
      locale: const Locale('fr', 'BF'),
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('fr'),
        Locale('fr', 'BF'),
        Locale('en', 'US'),
      ],
      routerConfig: router,
    );
  }
}
