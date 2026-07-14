enum UtilisateurRole {
  passager('passager'),
  chauffeur('chauffeur'),
  proprietaire('proprietaire');

  final String value;

  const UtilisateurRole(this.value);

  static UtilisateurRole? fromString(String? value) {
    if (value == null) return null;
    try {
      return UtilisateurRole.values.firstWhere((role) => role.value == value);
    } catch (_) {
      return null;
    }
  }
}
