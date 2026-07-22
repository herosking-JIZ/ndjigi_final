// ── Helpers de parsing JSON défensif, réutilisés par les modèles écrits
// à la main (non freezed) qui reçoivent des Decimal/Int potentiellement
// sérialisés en String par le backend.

double? parseDoubleNullable(dynamic value) {
  if (value == null) return null;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}

int parseIntWithFallback(dynamic value, {int fallback = 0}) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? fallback;
  return fallback;
}
