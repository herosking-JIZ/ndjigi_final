/// Parser pour extraire les paramètres du callback Keycloak
class DeepLinkParser {
  static Map<String, String> parseKeycloakCallback(Uri uri) {
    return {
      'code': uri.queryParameters['code'] ?? '',
      'state': uri.queryParameters['state'] ?? '',
      'error': uri.queryParameters['error'] ?? '',
      'error_description': uri.queryParameters['error_description'] ?? '',
    };
  }

  static bool isKeycloakCallback(Uri uri) {
    return uri.scheme == 'ndjigi-mobile' &&
        (uri.host == 'callback' || uri.host == 'logout-callback');
  }
}
