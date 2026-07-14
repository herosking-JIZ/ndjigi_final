# Guide d'Implémentation - Flutter
## Exemples Pratiques et Cas d'Usage

---

## Table des Matières
1. [Configuration Initiale](#configuration)
2. [Intégration Dio avec Intercepteurs](#dio-interceptor)
3. [Gestion d'État avec Riverpod](#riverpod)
4. [Navigation Authentifiée](#navigation)
5. [Cas d'Usage Pratiques](#cas-usage)
6. [Tests Unitaires](#tests)

---

## Configuration Initiale {#configuration}

### 1. pubspec.yaml Complet

```yaml
name: ndjigi_mobile
description: "Application mobile N'DJIGI - Plateforme de mobilité partagée"
publish_to: 'none'

version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

  # HTTP & Networking
  dio: ^5.3.1
  http: ^1.1.0

  # Security
  flutter_secure_storage: ^9.0.0
  flutter_keychain: ^2.4.0

  # JWT
  jwt_decoder: ^2.0.1
  
  # State Management
  riverpod: ^2.4.0
  flutter_riverpod: ^2.4.0
  riverpod_generator: ^2.3.0

  # Navigation
  go_router: ^12.0.0

  # UI
  flutter_svg: ^2.0.0
  cached_network_image: ^3.3.0
  
  # Local Storage
  shared_preferences: ^2.2.0
  hive: ^2.2.3
  
  # Logging
  logger: ^2.0.0
  
  # Connectivity
  connectivity_plus: ^5.0.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
  build_runner: ^2.4.0
  riverpod_generator: ^2.3.0

flutter:
  uses-material-design: true
```

---

## Intégration Dio avec Intercepteurs {#dio-interceptor}

Dio est plus puissant que http pour gérer les intercepteurs et retry automatiques.

### Configuration Dio Globale

```dart
// lib/services/dio_service.dart

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:logger/logger.dart';

class DioService {
  static final DioService _instance = DioService._internal();
  
  late Dio _dio;
  final _storage = const FlutterSecureStorage();
  final _logger = Logger();
  
  String? _currentAccessToken;
  String? _currentRefreshToken;
  
  factory DioService() {
    return _instance;
  }
  
  DioService._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: 'http://localhost:8000/api/v1',
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );
    
    // Interceptors
    _dio.interceptors.add(_LoggingInterceptor(_logger));
    _dio.interceptors.add(_AuthInterceptor(this, _storage, _logger));
    _dio.interceptors.add(_RetryInterceptor(_dio, _logger));
  }
  
  Dio get client => _dio;
  
  Future<void> initialize(String accessToken, String refreshToken) async {
    _currentAccessToken = accessToken;
    _currentRefreshToken = refreshToken;
  }
  
  Future<String?> getAccessToken() async {
    return _currentAccessToken ?? await _storage.read(key: 'access_token');
  }
  
  Future<void> setAccessToken(String token) async {
    _currentAccessToken = token;
    await _storage.write(key: 'access_token', value: token);
  }
  
  Future<void> setRefreshToken(String token) async {
    _currentRefreshToken = token;
    await _storage.write(key: 'refresh_token', value: token);
  }
  
  Future<void> clearTokens() async {
    _currentAccessToken = null;
    _currentRefreshToken = null;
    await _storage.delete(key: 'access_token');
    await _storage.delete(key: 'refresh_token');
  }
}

// Interceptor pour Logging
class _LoggingInterceptor extends Interceptor {
  final Logger logger;
  
  _LoggingInterceptor(this.logger);
  
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    logger.d(
      'REQUEST → ${options.method.toUpperCase()} ${options.path}\n'
      'Headers: ${options.headers}\n'
      'Data: ${options.data}',
    );
    super.onRequest(options, handler);
  }
  
  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    logger.d(
      'RESPONSE ← ${response.statusCode} ${response.requestOptions.path}\n'
      'Data: ${response.data}',
    );
    super.onResponse(response, handler);
  }
  
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    logger.e(
      'ERROR → ${err.requestOptions.path}\n'
      'Status: ${err.response?.statusCode}\n'
      'Message: ${err.message}',
      error: err,
      stackTrace: err.stackTrace,
    );
    super.onError(err, handler);
  }
}

// Interceptor pour Authentification
class _AuthInterceptor extends Interceptor {
  final DioService dioService;
  final FlutterSecureStorage storage;
  final Logger logger;
  bool _isRefreshing = false;
  final List<RequestInterceptorHandler> _pendingRequests = [];
  
  _AuthInterceptor(this.dioService, this.storage, this.logger);
  
  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Ajouter le token à chaque requête
    final token = await dioService.getAccessToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    
    super.onRequest(options, handler);
  }
  
  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    // Vérifier si erreur 401
    if (err.response?.statusCode == 401) {
      if (!_isRefreshing) {
        _isRefreshing = true;
        
        try {
          // Essayer de rafraîchir le token
          final refreshToken = await storage.read(key: 'refresh_token');
          
          if (refreshToken == null) {
            // Pas de refresh token → forcer logout
            throw DioException(
              requestOptions: err.requestOptions,
              message: 'Session expirée',
              type: DioExceptionType.unknown,
            );
          }
          
          // Faire la requête de refresh
          final response = await Dio().post(
            '${dioService.client.options.baseUrl}/auth/refresh',
            data: {'refresh_token': refreshToken},
          );
          
          final newAccessToken = response.data['access_token'];
          final newRefreshToken = response.data['refresh_token'];
          
          // Mettre à jour les tokens
          await dioService.setAccessToken(newAccessToken);
          await dioService.setRefreshToken(newRefreshToken);
          
          // Mettre à jour le header de la requête originale
          err.requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
          
          // Relancer toutes les requêtes en attente
          for (final pendingHandler in _pendingRequests) {
            pendingHandler.next(err.requestOptions);
          }
          _pendingRequests.clear();
          
          // Relancer la requête originale
          return handler.resolve(
            await dioService.client.request(
              err.requestOptions.path,
              options: Options(
                method: err.requestOptions.method,
                headers: err.requestOptions.headers,
              ),
              data: err.requestOptions.data,
              queryParameters: err.requestOptions.queryParameters,
            ),
          );
        } catch (e) {
          logger.e('Erreur rafraîchissement token: $e');
          await dioService.clearTokens();
          _isRefreshing = false;
          return handler.reject(err);
        }
      } else {
        // Requête en attente pendant le rafraîchissement
        _pendingRequests.add(handler);
      }
    } else {
      super.onError(err, handler);
    }
  }
}

// Interceptor pour Retry automatique
class _RetryInterceptor extends Interceptor {
  final Dio dio;
  final Logger logger;
  static const maxRetries = 3;
  
  _RetryInterceptor(this.dio, this.logger);
  
  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (_shouldRetry(err)) {
      final retryCount = err.requestOptions.extra['retryCount'] ?? 0;
      
      if (retryCount < maxRetries) {
        err.requestOptions.extra['retryCount'] = retryCount + 1;
        
        // Attendre avant de réessayer (backoff exponentiel)
        await Future.delayed(Duration(milliseconds: 500 * (retryCount + 1)));
        
        logger.i('Retry ${retryCount + 1}/$maxRetries pour ${err.requestOptions.path}');
        
        return handler.resolve(
          await dio.request(
            err.requestOptions.path,
            options: Options(
              method: err.requestOptions.method,
              headers: err.requestOptions.headers,
            ),
            data: err.requestOptions.data,
            queryParameters: err.requestOptions.queryParameters,
          ),
        );
      }
    }
    
    super.onError(err, handler);
  }
  
  bool _shouldRetry(DioException err) {
    // Retry sur erreurs réseau ou timeouts
    return err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.unknown ||
        (err.response?.statusCode == 503); // Service unavailable
  }
}
```

---

## Gestion d'État avec Riverpod {#riverpod}

Riverpod offre une gestion d'état réactive et type-safe.

### Providers d'Authentification

```dart
// lib/providers/auth_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'dart:io';

part 'auth_provider.g.dart';

// Modèles
class User {
  final String id;
  final String email;
  final String prenom;
  final String nom;
  final String numeroTelephone;
  final List<String> roles;
  final String statutCompte;
  final bool deuxFaActivee;
  
  User({
    required this.id,
    required this.email,
    required this.prenom,
    required this.nom,
    required this.numeroTelephone,
    required this.roles,
    required this.statutCompte,
    required this.deuxFaActivee,
  });
  
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id_utilisateur'] ?? '',
      email: json['email'] ?? '',
      prenom: json['prenom'] ?? '',
      nom: json['nom'] ?? '',
      numeroTelephone: json['numero_telephone'] ?? '',
      roles: List<String>.from(json['roles'] ?? []),
      statutCompte: json['statut_compte'] ?? 'actif',
      deuxFaActivee: json['deux_fa_activee'] ?? false,
    );
  }
  
  bool hasRole(String role) => roles.contains(role);
  bool isAdmin => hasRole('admin');
  bool isDriver => hasRole('chauffeur');
  bool isPassenger => hasRole('passager');
  bool isOwner => hasRole('proprietaire');
  bool isManager => hasRole('gestionnaire');
}

class AuthTokens {
  final String accessToken;
  final String refreshToken;
  final int expiresIn;
  
  AuthTokens({
    required this.accessToken,
    required this.refreshToken,
    required this.expiresIn,
  });
  
  factory AuthTokens.fromJson(Map<String, dynamic> json) {
    return AuthTokens(
      accessToken: json['access_token'] ?? '',
      refreshToken: json['refresh_token'] ?? '',
      expiresIn: json['expires_in'] ?? 900,
    );
  }
}

// Exceptions personnalisées
class AuthException implements Exception {
  final String message;
  final int? statusCode;
  
  AuthException(this.message, {this.statusCode});
  
  @override
  String toString() => message;
}

// Service d'authentification
@riverpod
class AuthService extends _$AuthService {
  late DioService _dioService;
  
  @override
  Future<void> build() async {
    _dioService = DioService();
    
    // Initialiser les tokens depuis le stockage
    final accessToken = await _dioService.getAccessToken();
    if (accessToken != null) {
      final refreshToken = await _dioService.client.options.baseUrl;
      // Tokens déjà chargés au démarrage
    }
  }
  
  // Login
  Future<User> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dioService.client.post(
        '/auth/login',
        data: {
          'email': email,
          'password': password,
          'grant_type': 'password',
        },
      );
      
      final tokens = AuthTokens.fromJson(response.data);
      final user = User.fromJson(response.data['user']);
      
      // Sauvegarder les tokens
      await _dioService.setAccessToken(tokens.accessToken);
      await _dioService.setRefreshToken(tokens.refreshToken);
      
      // Invalider les providers pour rafraîchir l'état
      ref.invalidate(userProvider);
      
      return user;
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw AuthException('Email ou mot de passe incorrect');
      } else if (e.response?.statusCode == 429) {
        throw AuthException('Trop de tentatives. Réessayez plus tard.');
      }
      throw AuthException('Erreur de connexion: ${e.message}');
    } catch (e) {
      throw AuthException('Erreur inconnue: $e');
    }
  }
  
  // Logout
  Future<void> logout() async {
    try {
      final accessToken = await _dioService.getAccessToken();
      if (accessToken != null) {
        // Notifier le serveur
        await _dioService.client.post(
          '/auth/logout',
          options: Options(
            headers: {'Authorization': 'Bearer $accessToken'},
          ),
        );
      }
    } catch (e) {
      // Continuer même si erreur réseau
    } finally {
      await _dioService.clearTokens();
      ref.invalidate(userProvider);
      ref.invalidate(authServiceProvider);
    }
  }
  
  // Récupérer le profil utilisateur
  Future<User> getProfile() async {
    final response = await _dioService.client.get('/utilisateur/profil');
    return User.fromJson(response.data);
  }
  
  // Demander OTP
  Future<void> requestOTP(String phoneNumber) async {
    try {
      await _dioService.client.post(
        '/auth/otp/request',
        data: {'numero_telephone': phoneNumber},
      );
    } on DioException catch (e) {
      throw AuthException(
        e.response?.data['message'] ?? 'Erreur OTP',
        statusCode: e.response?.statusCode,
      );
    }
  }
  
  // Vérifier OTP
  Future<void> verifyOTP({
    required String otpCode,
    required String phoneNumber,
  }) async {
    try {
      await _dioService.client.post(
        '/auth/otp/verify',
        data: {
          'otp_code': otpCode,
          'numero_telephone': phoneNumber,
        },
      );
      ref.invalidate(userProvider);
    } on DioException catch (e) {
      throw AuthException(
        e.response?.data['message'] ?? 'Code invalide',
        statusCode: e.response?.statusCode,
      );
    }
  }
}

// Providers
@riverpod
Future<User> user(UserRef ref) async {
  final authService = ref.watch(authServiceProvider);
  return authService.whenData((service) async => service.getProfile());
}

@riverpod
Future<bool> isAuthenticated(IsAuthenticatedRef ref) async {
  try {
    await ref.watch(userProvider.future);
    return true;
  } catch (_) {
    return false;
  }
}

@riverpod
Future<bool> isAdmin(IsAdminRef ref) async {
  final user = await ref.watch(userProvider.future);
  return user.isAdmin;
}

@riverpod
Future<bool> isDriver(IsDriverRef ref) async {
  final user = await ref.watch(userProvider.future);
  return user.isDriver;
}

@riverpod
Future<bool> isPassenger(IsPassengerRef ref) async {
  final user = await ref.watch(userProvider.future);
  return user.isPassenger;
}
```

---

## Navigation Authentifiée {#navigation}

```dart
// lib/router/app_router.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AppRouter {
  static final GoRouter router = GoRouter(
    redirect: _handleRedirect,
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: '/otp',
        builder: (context, state) => OTPScreen(
          phoneNumber: state.extra as String,
        ),
      ),
    ],
  );
  
  static Future<String?> _handleRedirect(
    BuildContext context,
    GoRouterState state,
  ) async {
    final isAuthenticated = await _checkAuthentication();
    final isLogin = state.matchedLocation == '/login';
    
    // Si non authentifié et pas sur login → aller à login
    if (!isAuthenticated && !isLogin) {
      return '/login';
    }
    
    // Si authentifié et sur login → aller à home
    if (isAuthenticated && isLogin) {
      return '/home';
    }
    
    return null;
  }
  
  static Future<bool> _checkAuthentication() async {
    final dioService = DioService();
    final token = await dioService.getAccessToken();
    return token != null && token.isNotEmpty;
  }
}
```

---

## Cas d'Usage Pratiques {#cas-usage}

### 1. Écran de Connexion Complet

```dart
// lib/screens/login_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  bool showPassword = false;
  bool isLoading = false;
  String? errorMessage;

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  bool _validateEmail(String email) {
    final emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    );
    return emailRegex.hasMatch(email);
  }

  bool _validatePassword(String password) {
    // Au moins 12 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
    return password.length >= 12 &&
        password.contains(RegExp(r'[A-Z]')) &&
        password.contains(RegExp(r'[a-z]')) &&
        password.contains(RegExp(r'[0-9]')) &&
        password.contains(RegExp(r'[!@#$%^&*]'));
  }

  Future<void> _handleLogin() async {
    if (!_validateEmail(emailController.text)) {
      setState(() => errorMessage = 'Email invalide');
      return;
    }

    if (emailController.text.isEmpty || passwordController.text.isEmpty) {
      setState(() => errorMessage = 'Remplissez tous les champs');
      return;
    }

    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      final authService = ref.read(authServiceProvider);
      
      await authService.login(
        email: emailController.text,
        password: passwordController.text,
      );

      if (!mounted) return;

      // Succès
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Connexion réussie')),
      );
      
      context.go('/home');
    } catch (e) {
      setState(() => errorMessage = e.toString());
    } finally {
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Connexion'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Logo
            SizedBox(
              height: 100,
              child: Image.asset('assets/logo.png'),
            ),
            const SizedBox(height: 32),

            // Email Input
            TextField(
              controller: emailController,
              decoration: InputDecoration(
                labelText: 'Email',
                prefixIcon: const Icon(Icons.email),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                errorText: errorMessage?.contains('Email') ? errorMessage : null,
              ),
              keyboardType: TextInputType.emailAddress,
              onChanged: (_) => setState(() => errorMessage = null),
            ),
            const SizedBox(height: 16),

            // Password Input
            TextField(
              controller: passwordController,
              decoration: InputDecoration(
                labelText: 'Mot de passe',
                prefixIcon: const Icon(Icons.lock),
                suffixIcon: IconButton(
                  icon: Icon(
                    showPassword ? Icons.visibility : Icons.visibility_off,
                  ),
                  onPressed: () => setState(() => showPassword = !showPassword),
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                helperText: 'Min 12 caractères, majuscule, minuscule, chiffre, caractère spécial',
              ),
              obscureText: !showPassword,
              onChanged: (_) => setState(() => errorMessage = null),
            ),
            const SizedBox(height: 24),

            // Error Message
            if (errorMessage != null && !errorMessage!.contains('Email') && !errorMessage!.contains('Remplissez'))
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red[100],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red),
                  ),
                  child: Text(
                    errorMessage!,
                    style: const TextStyle(color: Colors.red),
                  ),
                ),
              ),

            // Login Button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: isLoading ? null : _handleLogin,
                child: isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Se Connecter'),
              ),
            ),
            const SizedBox(height: 16),

            // Register Link
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text("Pas de compte ? "),
                TextButton(
                  onPressed: () => context.push('/register'),
                  child: const Text('S\'inscrire'),
                ),
              ],
            ),

            // Forgot Password Link
            TextButton(
              onPressed: () {
                // TODO: Implement forgot password
              },
              child: const Text('Mot de passe oublié ?'),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

### 2. Écran OTP Complet

```dart
// lib/screens/otp_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class OTPScreen extends ConsumerStatefulWidget {
  final String phoneNumber;
  
  const OTPScreen({
    Key? key,
    required this.phoneNumber,
  }) : super(key: key);

  @override
  ConsumerState<OTPScreen> createState() => _OTPScreenState();
}

class _OTPScreenState extends ConsumerState<OTPScreen> {
  final otpControllers = List.generate(6, (_) => TextEditingController());
  String? errorMessage;
  bool isLoading = false;
  int secondsRemaining = 300; // 5 minutes
  bool canResend = false;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted) {
        setState(() {
          secondsRemaining--;
          if (secondsRemaining == 0) {
            canResend = true;
          } else if (secondsRemaining > 0) {
            _startTimer();
          }
        });
      }
    });
  }

  String _formatTime(int seconds) {
    final minutes = seconds ~/ 60;
    final secs = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  Future<void> _handleVerifyOTP() async {
    final otpCode = otpControllers.map((c) => c.text).join();
    
    if (otpCode.length != 6 || !otpCode.every((c) => c.contains(RegExp(r'[0-9]')))) {
      setState(() => errorMessage = 'Code invalide');
      return;
    }

    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      final authService = ref.read(authServiceProvider);
      
      await authService.verifyOTP(
        otpCode: otpCode,
        phoneNumber: widget.phoneNumber,
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('OTP vérifié avec succès')),
      );
      
      context.go('/home');
    } catch (e) {
      setState(() => errorMessage = e.toString());
    } finally {
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
  }

  Future<void> _handleResendOTP() async {
    try {
      final authService = ref.read(authServiceProvider);
      await authService.requestOTP(widget.phoneNumber);
      
      if (!mounted) return;
      
      setState(() {
        canResend = false;
        secondsRemaining = 300;
      });
      
      _startTimer();
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Code renvoyé')),
      );
    } catch (e) {
      setState(() => errorMessage = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Vérification SMS'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            // Icon
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue[100],
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.sms,
                size: 48,
                color: Colors.blue[800],
              ),
            ),
            const SizedBox(height: 24),

            // Instructions
            Text(
              'Vérification du numéro',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 12),
            Text(
              'Un code de vérification a été envoyé à ${widget.phoneNumber}',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 32),

            // OTP Input
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: List.generate(
                6,
                (index) => SizedBox(
                  width: 48,
                  height: 56,
                  child: TextField(
                    controller: otpControllers[index],
                    textAlign: TextAlign.center,
                    keyboardType: TextInputType.number,
                    maxLength: 1,
                    decoration: InputDecoration(
                      counterText: '',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    onChanged: (value) {
                      if (value.isNotEmpty && index < 5) {
                        FocusScope.of(context).nextFocus();
                      }
                    },
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Error Message
            if (errorMessage != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    errorMessage!,
                    style: const TextStyle(color: Colors.red),
                  ),
                ),
              ),

            // Verify Button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: isLoading ? null : _handleVerifyOTP,
                child: isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Vérifier'),
              ),
            ),
            const SizedBox(height: 16),

            // Timer & Resend
            Column(
              children: [
                Text(
                  'Code expire dans: ${_formatTime(secondsRemaining)}',
                  style: TextStyle(
                    color: secondsRemaining < 60 ? Colors.orange : Colors.grey,
                  ),
                ),
                const SizedBox(height: 8),
                if (canResend)
                  TextButton(
                    onPressed: _handleResendOTP,
                    child: const Text('Renvoyer le code'),
                  )
                else
                  TextButton(
                    onPressed: null,
                    child: Text(
                      'Renvoyer dans ${_formatTime(secondsRemaining)}',
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    for (var controller in otpControllers) {
      controller.dispose();
    }
    super.dispose();
  }
}
```

---

### 3. Gestion des Utilisateurs par Rôle

```dart
// lib/screens/role_based_home.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class RoleBasedHome extends ConsumerWidget {
  const RoleBasedHome({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(userProvider);

    return userAsync.when(
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (err, st) => Scaffold(
        body: Center(child: Text('Erreur: $err')),
      ),
      data: (user) {
        // Afficher l'écran en fonction du rôle principal
        if (user.isDriver) {
          return const DriverHome();
        } else if (user.isPassenger) {
          return const PassengerHome();
        } else if (user.isOwner) {
          return const OwnerHome();
        } else if (user.isManager) {
          return const ManagerHome();
        } else if (user.isAdmin) {
          return const AdminHome();
        } else {
          return Scaffold(
            body: Center(
              child: Text('Rôle non reconnu: ${user.roles}'),
            ),
          );
        }
      },
    );
  }
}

// Écrans spécifiques par rôle
class DriverHome extends StatelessWidget {
  const DriverHome({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Tableau de bord Chauffeur')),
      body: ListView(
        children: [
          ListTile(
            title: const Text('Mes trajets'),
            leading: const Icon(Icons.directions_car),
            onTap: () {},
          ),
          ListTile(
            title: const Text('Disponibilité'),
            leading: const Icon(Icons.location_on),
            onTap: () {},
          ),
          ListTile(
            title: const Text('Historique'),
            leading: const Icon(Icons.history),
            onTap: () {},
          ),
        ],
      ),
    );
  }
}

class PassengerHome extends StatelessWidget {
  const PassengerHome({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Accueil Passager')),
      body: ListView(
        children: [
          ListTile(
            title: const Text('Réserver un trajet'),
            leading: const Icon(Icons.add_location),
            onTap: () {},
          ),
          ListTile(
            title: const Text('Mes réservations'),
            leading: const Icon(Icons.bookmark),
            onTap: () {},
          ),
          ListTile(
            title: const Text('Mes adresses'),
            leading: const Icon(Icons.home),
            onTap: () {},
          ),
        ],
      ),
    );
  }
}

class OwnerHome extends StatelessWidget {
  const OwnerHome({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mon Garage')),
      body: ListView(
        children: [
          ListTile(
            title: const Text('Mes véhicules'),
            leading: const Icon(Icons.directions_car),
            onTap: () {},
          ),
          ListTile(
            title: const Text('Locations actives'),
            leading: const Icon(Icons.calendar_today),
            onTap: () {},
          ),
          ListTile(
            title: const Text('Revenus'),
            leading: const Icon(Icons.attach_money),
            onTap: () {},
          ),
        ],
      ),
    );
  }
}

class ManagerHome extends StatelessWidget {
  const ManagerHome({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Gestion Parking')),
      body: ListView(
        children: [
          ListTile(
            title: const Text('Occupations'),
            leading: const Icon(Icons.parking),
            onTap: () {},
          ),
          ListTile(
            title: const Text('Véhicules'),
            leading: const Icon(Icons.directions_car),
            onTap: () {},
          ),
          ListTile(
            title: const Text('Rapports'),
            leading: const Icon(Icons.assessment),
            onTap: () {},
          ),
        ],
      ),
    );
  }
}

class AdminHome extends StatelessWidget {
  const AdminHome({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Administration')),
      body: ListView(
        children: [
          ListTile(
            title: const Text('Utilisateurs'),
            leading: const Icon(Icons.people),
            onTap: () {},
          ),
          ListTile(
            title: const Text('Gestionnaires'),
            leading: const Icon(Icons.admin_panel_settings),
            onTap: () {},
          ),
          ListTile(
            title: const Text('Statistiques'),
            leading: const Icon(Icons.analytics),
            onTap: () {},
          ),
        ],
      ),
    );
  }
}
```

---

## Tests Unitaires {#tests}

```dart
// test/auth_service_test.dart

import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';

void main() {
  group('AuthService Tests', () {
    test('Login réussit avec les bonnes données', () async {
      // TODO: Implémenter les tests
    });

    test('Login échoue avec email invalide', () async {
      // TODO: Implémenter les tests
    });

    test('Logout blackliste le token', () async {
      // TODO: Implémenter les tests
    });

    test('Refresh token obtient un nouveau access token', () async {
      // TODO: Implémenter les tests
    });

    test('OTP request envoie un code SMS', () async {
      // TODO: Implémenter les tests
    });

    test('OTP verify active 2FA', () async {
      // TODO: Implémenter les tests
    });
  });
}
```

---

## Ressources Supplémentaires

- **Riverpod Documentation:** https://riverpod.dev
- **Dio Documentation:** https://github.com/flutterchina/dio
- **GoRouter Documentation:** https://pub.dev/packages/go_router
- **Flutter Secure Storage:** https://pub.dev/packages/flutter_secure_storage

---

**Dernière mise à jour:** Juin 2026  
