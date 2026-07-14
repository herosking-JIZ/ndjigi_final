import 'package:dio/dio.dart';
import '../config/app_config.dart';
import '../storage/secure_storage.dart';
import '../managers/auth_failure_manager.dart';

class ApiService {
  late final Dio _dio;
  final SecureStorage _storage;
  final AppConfig _config;
  bool _isRefreshing = false;

  ApiService({
    required SecureStorage storage,
    required AppConfig config,
  })  : _storage = storage,
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
            log = log.replaceAll(RegExp(r'"access_token":"[^"]+'), '"access_token":"****');
            log = log.replaceAll(RegExp(r'"refresh_token":"[^"]+'), '"refresh_token":"****');
            log = log.replaceAll(RegExp(r'"id_token":"[^"]+'), '"id_token":"****');
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
          if (error.response?.statusCode == 401) {
            // Anti-réentrance: if refresh already in flight, reject immediately
            if (_isRefreshing) {
              await _storage.clearTokens();
              AuthFailureManager.instance.notifyAuthFailed();
              return handler.reject(error);
            }

            final refreshToken = await _storage.getRefreshToken();
            if (refreshToken != null && refreshToken.isNotEmpty) {
              _isRefreshing = true;
              try {
                final response = await _refreshToken(refreshToken);
                final newAccessToken = response.data['access_token'] as String?;
                final newRefreshToken = response.data['refresh_token'] as String?;

                if (newAccessToken != null) {
                  await _storage.saveTokens(
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken ?? refreshToken,
                  );

                  // Retry original request
                  final opts = error.requestOptions;
                  opts.headers['Authorization'] = 'Bearer $newAccessToken';
                  return handler.resolve(await _dio.request(
                    opts.path,
                    options: Options(
                      method: opts.method,
                      headers: opts.headers,
                    ),
                    data: opts.data,
                    queryParameters: opts.queryParameters,
                  ));
                }
              } catch (_) {
                // Refresh failed, logout and reject error (not next)
                await _storage.clearTokens();
                AuthFailureManager.instance.notifyAuthFailed();
                return handler.reject(error);
              } finally {
                _isRefreshing = false;
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

  Future<Response> _refreshToken(String refreshToken) {
    return _dio.post(
      '/auth/refresh',
      options: Options(
        extra: {'skipRefresh': true},
      ),
      data: {'refresh_token': refreshToken},
    );
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
