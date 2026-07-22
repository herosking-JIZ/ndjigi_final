import 'package:dio/dio.dart';
import '../config/app_config.dart';
import '../storage/secure_storage.dart';
import '../managers/auth_failure_manager.dart';

class ApiService {
  late final Dio _dio;
  final SecureStorage _storage;
  final AppConfig _config;
  Future<String?>? _refreshFuture;

  ApiService({required SecureStorage storage, required AppConfig config})
    : _storage = storage,
      _config = config {
    _initDio();
  }

  void _initDio() {
    _dio = Dio(
      BaseOptions(
        baseUrl: _config.apiBaseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        contentType: 'application/json',
        responseType: ResponseType.json,
      ),
    );

    // Logging interceptor (dev only) - masquer les tokens sensibles
    if (AppConfig.isDebug) {
      _dio.interceptors.add(
        LogInterceptor(
          requestBody: true,
          responseBody: true,
          logPrint: (obj) {
            // Masquer les tokens en clair
            var log = obj.toString();
            log = log.replaceAll(RegExp(r'Bearer [^,\s}]+'), 'Bearer ****');
            log = log.replaceAll(
              RegExp(r'"access_token":"[^"]+'),
              '"access_token":"****',
            );
            log = log.replaceAll(
              RegExp(r'"refresh_token":"[^"]+'),
              '"refresh_token":"****',
            );
            log = log.replaceAll(
              RegExp(r'"id_token":"[^"]+'),
              '"id_token":"****',
            );
            print(log);
          },
        ),
      );
    }

    // JWT interceptor
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401 &&
              error.requestOptions.extra['skipRefresh'] != true) {
            final refreshToken = await _storage.getRefreshToken();
            if (refreshToken != null && refreshToken.isNotEmpty) {
              try {
                // Toutes les requêtes ayant reçu 401 attendent le même refresh.
                // Le token mobile doit être renouvelé avec le client public
                // ndjigi-mobile, pas avec le client confidentiel du backend.
                final newAccessToken = await (_refreshFuture ??=
                    _refreshAndStoreToken(refreshToken));

                if (newAccessToken != null) {
                  // Retry original request
                  final opts = error.requestOptions;
                  opts.headers['Authorization'] = 'Bearer $newAccessToken';
                  return handler.resolve(
                    await _dio.request(
                      opts.path,
                      options: Options(
                        method: opts.method,
                        headers: opts.headers,
                      ),
                      data: opts.data,
                      queryParameters: opts.queryParameters,
                    ),
                  );
                }
              } catch (_) {
                // Refresh failed, logout and reject error (not next)
                await _storage.clearTokens();
                AuthFailureManager.instance.notifyAuthFailed();
                return handler.reject(error);
              }
            } else {
              // No refresh token available, logout
              await _storage.clearTokens();
              AuthFailureManager.instance.notifyAuthFailed();
            }
          }
          return handler.next(error);
        },
      ),
    );
  }

  Future<String?> _refreshAndStoreToken(String refreshToken) async {
    try {
      // Dio séparé pour ne pas appliquer l'intercepteur API (et son Bearer)
      // à l'endpoint OAuth public de Keycloak.
      final response = await Dio().post<Map<String, dynamic>>(
        _config.keycloakTokenEndpoint,
        data: {
          'grant_type': 'refresh_token',
          'client_id': _config.keycloakClientId,
          'refresh_token': refreshToken,
        },
        options: Options(contentType: Headers.formUrlEncodedContentType),
      );

      final data = response.data;
      final accessToken = data?['access_token'] as String?;
      final newRefreshToken = data?['refresh_token'] as String?;
      if (accessToken == null || accessToken.isEmpty) return null;

      await _storage.saveTokens(
        accessToken: accessToken,
        refreshToken: newRefreshToken ?? refreshToken,
      );
      return accessToken;
    } finally {
      _refreshFuture = null;
    }
  }

  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.get<T>(
        path,
        queryParameters: queryParameters,
        options: options,
      );
      return response.data as T;
    } on DioException {
      rethrow;
    }
  }

  Future<T> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.post<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return response.data as T;
    } on DioException {
      rethrow;
    }
  }

  Future<T> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.put<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return response.data as T;
    } on DioException {
      rethrow;
    }
  }

  Future<T> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.patch<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return response.data as T;
    } on DioException {
      rethrow;
    }
  }

  Future<T> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.delete<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return response.data as T;
    } on DioException {
      rethrow;
    }
  }

  Dio get dio => _dio;
}
