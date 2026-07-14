import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  static const String _keyAccessToken = 'access_token';
  static const String _keyRefreshToken = 'refresh_token';
  static const String _keyUserId = 'user_id';
  static const String _keyActiveRole = 'active_role';

  final FlutterSecureStorage _storage;

  SecureStorage({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  Future<String?> getAccessToken() async {
    return await _storage.read(key: _keyAccessToken);
  }

  Future<String?> getRefreshToken() async {
    return await _storage.read(key: _keyRefreshToken);
  }

  Future<String?> getUserId() async {
    return await _storage.read(key: _keyUserId);
  }

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      _storage.write(key: _keyAccessToken, value: accessToken),
      _storage.write(key: _keyRefreshToken, value: refreshToken),
    ]);
  }

  Future<void> saveAccessToken(String token) async {
    await _storage.write(key: _keyAccessToken, value: token);
  }

  Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: _keyRefreshToken, value: token);
  }

  Future<void> saveUserId(String userId) async {
    await _storage.write(key: _keyUserId, value: userId);
  }

  Future<void> clearTokens() async {
    await Future.wait([
      _storage.delete(key: _keyAccessToken),
      _storage.delete(key: _keyRefreshToken),
    ]);
  }

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }

  Future<void> save(String key, String value) async {
    await _storage.write(key: key, value: value);
  }

  Future<String?> read(String key) async {
    return await _storage.read(key: key);
  }

  Future<void> delete(String key) async {
    await _storage.delete(key: key);
  }

  Future<bool> containsKey(String key) async {
    final value = await _storage.read(key: key);
    return value != null;
  }

  Future<void> saveActiveRole(String role) async {
    await _storage.write(key: _keyActiveRole, value: role);
  }

  Future<String?> getActiveRole() async {
    return await _storage.read(key: _keyActiveRole);
  }

  Future<void> saveCodeVerifier(String verifier) async {
    print('🔵 NDJIGI-AUTH: [storage] WRITE pkce_code_verifier');
    await _storage.write(key: 'pkce_code_verifier', value: verifier);
  }

  Future<String?> getCodeVerifier() async {
    final value = await _storage.read(key: 'pkce_code_verifier');
    print('🔵 NDJIGI-AUTH: [storage] READ pkce_code_verifier = ${value == null ? "NULL" : "PRESENT"}');
    return value;
  }

  Future<void> deleteCodeVerifier() async {
    print('🔵 NDJIGI-AUTH: [storage] DELETE pkce_code_verifier');
    await _storage.delete(key: 'pkce_code_verifier');
  }
}
