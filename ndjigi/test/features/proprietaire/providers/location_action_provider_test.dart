import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:ndjigi/features/proprietaire/data/location_repository.dart';
import 'package:ndjigi/features/proprietaire/data/models/location_owner_view.dart';
import 'package:ndjigi/features/proprietaire/presentation/providers/location_detail_provider.dart';
import 'package:ndjigi/features/proprietaire/presentation/providers/locations_provider.dart';

class MockLocationRepository extends Mock implements LocationRepository {}

void main() {
  late MockLocationRepository repository;
  late ProviderContainer container;
  const idLocation = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  setUp(() {
    repository = MockLocationRepository();
    when(() => repository.getMesLocations(statut: any(named: 'statut')))
        .thenAnswer((_) async => <LocationOwnerView>[]);
    container = ProviderContainer(
      overrides: [locationRepositoryProvider.overrideWithValue(repository)],
    );
    // locationActionProvider est autoDispose : sans écouteur actif, son état
    // est réinitialisé dès la première lecture terminée — on le garde vivant
    // ici comme le ferait l'écran (ref.watch) le temps du test.
    container.listen(locationActionProvider(idLocation), (_, _) {});
  });

  tearDown(() => container.dispose());

  test('terminer() invalide les listes en_attente/active/historique et passe success à true', () async {
    when(() => repository.terminer(idLocation)).thenAnswer((_) async {});

    // Écoute active des 3 listes pour qu'une invalidation déclenche un vrai refetch
    // (les FutureProvider.autoDispose sans écouteur seraient simplement supprimés).
    container.listen(locationsProvider('en_attente'), (_, _) {}, fireImmediately: true);
    container.listen(locationsProvider('active'), (_, _) {}, fireImmediately: true);
    container.listen(locationsProvider('historique'), (_, _) {}, fireImmediately: true);

    verify(() => repository.getMesLocations(statut: 'en_attente')).called(1);
    verify(() => repository.getMesLocations(statut: 'active')).called(1);
    verify(() => repository.getMesLocations(statut: 'historique')).called(1);

    final notifier = container.read(locationActionProvider(idLocation).notifier);
    final resultat = await notifier.terminer();
    // Laisse les providers invalidés (encore écoutés) se ré-exécuter.
    await Future<void>.delayed(Duration.zero);

    expect(resultat, isTrue);
    expect(container.read(locationActionProvider(idLocation)).success, isTrue);
    verify(() => repository.terminer(idLocation)).called(1);
    verify(() => repository.getMesLocations(statut: 'en_attente')).called(1);
    verify(() => repository.getMesLocations(statut: 'active')).called(1);
    verify(() => repository.getMesLocations(statut: 'historique')).called(1);
  });

  test('terminer() renvoie false et expose un message d\'erreur en cas d\'échec', () async {
    when(() => repository.terminer(idLocation)).thenThrow(Exception('boom'));

    final notifier = container.read(locationActionProvider(idLocation).notifier);
    final resultat = await notifier.terminer();

    expect(resultat, isFalse);
    final state = container.read(locationActionProvider(idLocation));
    expect(state.success, isFalse);
    expect(state.errorMessage, isNotNull);
  });
}
