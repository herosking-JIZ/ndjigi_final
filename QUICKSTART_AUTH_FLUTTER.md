# Démarrage Rapide - Authentification N'DJIGI en Flutter

Suivez ce guide pour intégrer l'authentification en **5 minutes**.

---

## 1. Installation des Dépendances (2 min)

```bash
# Installer les packages essentiels
flutter pub add dio flutter_secure_storage jwt_decoder flutter_riverpod go_router

# Build runner pour riverpod
flutter pub add --dev build_runner riverpod_generator
```

---

## 2. Configuration Base URL (1 min)

Créer `lib/constants/api.dart`:

```dart
class ApiConstants {
  static const String baseUrl = 'http://localhost:8000/api/v1'; // Dev
  // static const String baseUrl = 'https://api.ndjigi.com/api/v1'; // Prod
  
  // Endpoints Auth
  static const String login = '/auth/login';
  static const String logout = '/auth/logout';
  static const String refresh = '/auth/refresh';
  static const String otpRequest = '/auth/otp/request';
  static const String otpVerify = '/auth/otp/verify';
  
  // Endpoints User
  static const String userProfile = '/utilisateur/profil';
  
  // Timeouts
  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
```

---

## 3. Service d'Authentification Minimal (2 min)

Créer `lib/services/auth_service.dart`:

```dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'constants/api.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  late Dio _dio;
  final _storage = const FlutterSecureStorage();
  
  factory AuthService() => _instance;
  
  AuthService._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: ApiConstants.connectionTimeout,
        receiveTimeout: ApiConstants.receiveTimeout,
        headers: {'Content-Type': 'application/json'},
      ),
    );
    
    // Ajouter token à chaque requête
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'access_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
      ),
    );
  }
  
  /// Connexion
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        ApiConstants.login,
        data: {
          'email': email,
          'password': password,
          'grant_type': 'password',
        },
      );
      
      final tokens = {
        'access_token': response.data['access_token'],
        'refresh_token': response.data['refresh_token'],
      };
      
      // Sauvegarder
      await _storage.write(
        key: 'access_token',
        value: tokens['access_token'],
      );
      await _storage.write(
        key: 'refresh_token',
        value: tokens['refresh_token'],
      );
      
      return {
        'success': true,
        'user': response.data['user'],
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': _getErrorMessage(e),
      };
    }
  }
  
  /// Déconnexion
  Future<void> logout() async {
    try {
      await _dio.post(ApiConstants.logout);
    } finally {
      await _storage.delete(key: 'access_token');
      await _storage.delete(key: 'refresh_token');
    }
  }
  
  /// Vérifier si connecté
  Future<bool> isAuthenticated() async {
    final token = await _storage.read(key: 'access_token');
    return token != null && token.isNotEmpty;
  }
  
  /// Récupérer le profil
  Future<Map<String, dynamic>> getProfile() async {
    final response = await _dio.get(ApiConstants.userProfile);
    return response.data;
  }
  
  String _getErrorMessage(DioException e) {
    if (e.response?.statusCode == 401) {
      return 'Email ou mot de passe incorrect';
    } else if (e.response?.statusCode == 429) {
      return 'Trop de tentatives. Réessayez plus tard.';
    }
    return e.message ?? 'Erreur de connexion';
  }
}
```

---

## 4. Setup Routing (1 min)

Créer `lib/router.dart`:

```dart
import 'package:go_router/go_router.dart';
import 'services/auth_service.dart';

class AppRouter {
  static GoRouter router(bool isAuthenticated) => GoRouter(
    initialLocation: isAuthenticated ? '/home' : '/login',
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
    ],
    redirect: (context, state) async {
      final isAuth = await AuthService().isAuthenticated();
      final isLoggingIn = state.matchedLocation == '/login';
      
      if (!isAuth && !isLoggingIn) return '/login';
      if (isAuth && isLoggingIn) return '/home';
      return null;
    },
  );
}
```

---

## 5. Écran de Connexion Minimal (2 min)

Créer `lib/screens/login_screen.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final emailCtrl = TextEditingController();
  final passCtrl = TextEditingController();
  bool isLoading = false;
  String? error;

  @override
  void dispose() {
    emailCtrl.dispose();
    passCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    setState(() {
      isLoading = true;
      error = null;
    });

    final result = await AuthService().login(
      email: emailCtrl.text,
      password: passCtrl.text,
    );

    if (!mounted) return;

    if (result['success']) {
      context.go('/home');
    } else {
      setState(() => error = result['message']);
    }

    setState(() => isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Connexion')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TextField(
              controller: emailCtrl,
              decoration: const InputDecoration(
                labelText: 'Email',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: passCtrl,
              decoration: const InputDecoration(
                labelText: 'Mot de passe',
                border: OutlineInputBorder(),
              ),
              obscureText: true,
            ),
            const SizedBox(height: 16),
            if (error != null)
              Text(error!, style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: isLoading ? null : _login,
                child: isLoading
                    ? const CircularProgressIndicator()
                    : const Text('Connexion'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## 6. Écrans Placeholders

Créer `lib/screens/home_screen.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/auth_service.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Accueil'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await AuthService().logout();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('Bienvenue sur N\'DJIGI'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.push('/profile'),
              child: const Text('Voir Profil'),
            ),
          ],
        ),
      ),
    );
  }
}

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profil')),
      body: FutureBuilder(
        future: AuthService().getProfile(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Erreur: ${snapshot.error}'));
          }
          final user = snapshot.data as Map<String, dynamic>;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              ListTile(
                title: const Text('Email'),
                subtitle: Text(user['email'] ?? ''),
              ),
              ListTile(
                title: const Text('Nom'),
                subtitle: Text(user['nom'] ?? ''),
              ),
              ListTile(
                title: const Text('Prénom'),
                subtitle: Text(user['prenom'] ?? ''),
              ),
              ListTile(
                title: const Text('Rôles'),
                subtitle: Text((user['roles'] ?? []).join(', ')),
              ),
            ],
          );
        },
      ),
    );
  }
}
```

---

## 7. App Principal

Modifier `lib/main.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'router.dart';
import 'services/auth_service.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/profile_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  late GoRouter _router;

  @override
  void initState() {
    super.initState();
    _initRouter();
  }

  Future<void> _initRouter() async {
    final isAuth = await AuthService().isAuthenticated();
    _router = AppRouter.router(isAuth);
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'N\'DJIGI',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      routerConfig: _router,
    );
  }
}
```

---

## 8. Structure Finale

```
lib/
├── main.dart
├── router.dart
├── constants/
│   └── api.dart
├── services/
│   └── auth_service.dart
└── screens/
    ├── login_screen.dart
    ├── home_screen.dart
    └── profile_screen.dart
```

---

## 9. Tester

```bash
# Run l'app
flutter run

# Tester la connexion
# Email: ahmed.traore@example.com
# Password: SecurePass@2026 (doit respecter les critères)
```

---

## Checklist ✅

- [ ] Installer les dépendances (`flutter pub add ...`)
- [ ] Créer `api.dart` avec configuration
- [ ] Créer `auth_service.dart` avec les endpoints
- [ ] Créer `router.dart` avec navigation
- [ ] Créer `login_screen.dart`
- [ ] Créer `home_screen.dart` et `profile_screen.dart`
- [ ] Mettre à jour `main.dart`
- [ ] Tester la connexion
- [ ] Tester la déconnexion
- [ ] Tester la récupération du profil

---

## Prochaines Étapes

Après ce setup initial, consultez:

1. **`DOCUMENTATION_AUTHENTIFICATION_FLUTTER.md`** - Documentation complète de l'API
2. **`GUIDE_IMPLEMENTATION_FLUTTER.md`** - Patterns avancés (Riverpod, Dio interceptors, 2FA)

---

## Aide Rapide

**Erreur "Token expiré"?**
→ Le service d'authentification doit implémenter la refresh automatique (voir guide complet)

**Besoin de 2FA/OTP?**
→ Voir `GUIDE_IMPLEMENTATION_FLUTTER.md` section "OTP Complet"

**Gestionnaire des états?**
→ Utiliser Riverpod au lieu du simple service (voir guide complet)

---

**Durée estimée:** 15 minutes  
**Niveau:** Débutant  
**Prérequis:** Flutter 3.0+, Dart 3.0+
