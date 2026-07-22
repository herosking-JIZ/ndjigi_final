import 'package:flutter_test/flutter_test.dart';
import 'package:ndjigi/core/utils/json_parsers.dart';
import 'package:ndjigi/shared/models/rental_vehicule_resume.dart';

void main() {
  group('parseDoubleNullable', () {
    test('retourne null si la valeur est null', () {
      expect(parseDoubleNullable(null), isNull);
    });

    test('retourne le double tel quel', () {
      expect(parseDoubleNullable(12.5), 12.5);
    });

    test('convertit un int en double', () {
      expect(parseDoubleNullable(10), 10.0);
    });

    test('parse une String numérique', () {
      expect(parseDoubleNullable('7.25'), 7.25);
    });

    test('retourne null pour une String non numérique', () {
      expect(parseDoubleNullable('abc'), isNull);
    });
  });

  group('parseIntWithFallback', () {
    test('retourne l\'int tel quel', () {
      expect(parseIntWithFallback(4), 4);
    });

    test('convertit un num en int', () {
      expect(parseIntWithFallback(4.9), 4);
    });

    test('parse une String numérique', () {
      expect(parseIntWithFallback('12'), 12);
    });

    test('retourne le fallback pour une valeur invalide ou nulle', () {
      expect(parseIntWithFallback('abc', fallback: 3), 3);
      expect(parseIntWithFallback(null, fallback: 5), 5);
      expect(parseIntWithFallback(null), 0);
    });
  });

  group('VehiculeResume.fromJson', () {
    test('parse un JSON complet', () {
      final vehicule = VehiculeResume.fromJson({
        'marque': 'Toyota',
        'modele': 'Corolla',
        'annee': 2020,
        'immatriculation': 'BF-1234-AA',
      });

      expect(vehicule.marque, 'Toyota');
      expect(vehicule.modele, 'Corolla');
      expect(vehicule.annee, 2020);
      expect(vehicule.immatriculation, 'BF-1234-AA');
      expect(vehicule.nomComplet, 'Toyota Corolla');
    });

    test('gère les champs manquants sans lever d\'exception', () {
      final vehicule = VehiculeResume.fromJson(const {});

      expect(vehicule.marque, isNull);
      expect(vehicule.modele, isNull);
      expect(vehicule.annee, isNull);
      expect(vehicule.immatriculation, isNull);
      expect(vehicule.nomComplet, '');
    });
  });
}
