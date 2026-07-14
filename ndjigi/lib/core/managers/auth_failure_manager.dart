/// Global manager to signal auth failures without circular dependency
/// Used by ApiService interceptor to notify when refresh fails permanently
class AuthFailureManager {
  static final instance = AuthFailureManager._();

  Function()? _onAuthFailed;

  AuthFailureManager._();

  /// Register callback to be called when auth refresh fails permanently
  void setOnAuthFailedCallback(Function() callback) {
    _onAuthFailed = callback;
  }

  /// Signal that authentication has failed permanently (tokens invalid/expired)
  /// This triggers the registered callback, which invalidates authProvider
  void notifyAuthFailed() {
    _onAuthFailed?.call();
  }

  /// Clear the callback (useful for testing or cleanup)
  void clear() {
    _onAuthFailed = null;
  }
}
