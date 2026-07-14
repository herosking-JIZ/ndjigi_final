import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import '../../../../core/constants/routes.dart';
import '../../../../core/providers/app_providers.dart';
import '../../../../core/providers/gps_provider.dart';
import '../../../../core/services/map_service.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../data/models/course.dart';
import '../providers/course_provider.dart';

// ── Écran de demande VTC : départ, destination (via carte OSM) et catégorie ──

enum _Etape { depart, arrivee, categorie }

class DestinationSearchScreen extends ConsumerStatefulWidget {
  const DestinationSearchScreen({super.key});

  @override
  ConsumerState<DestinationSearchScreen> createState() =>
      _DestinationSearchScreenState();
}

class _DestinationSearchScreenState
    extends ConsumerState<DestinationSearchScreen> {
  _Etape _etape = _Etape.depart;
  final MapController _mapController = MapController();
  final TextEditingController _rechercheController = TextEditingController();

  LatLng _centre = const LatLng(12.3657, -1.5197); // Ouagadougou par défaut
  String? _adresseCourante;
  bool _chargementAdresse = false;
  bool _calculTrajetEnCours = false;
  bool _positionInitialeAppliquee = false;
  Timer? _debounce;
  List<NominatimPlace> _resultatsRecherche = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(courseProvider.notifier).chargerCategories();
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _rechercheController.dispose();
    super.dispose();
  }

  void _centrerSur(double lat, double lng) {
    setState(() => _centre = LatLng(lat, lng));
    _mapController.move(_centre, 15);
    _geocoderInverse(lat, lng);
  }

  Future<void> _geocoderInverse(double lat, double lng) async {
    setState(() => _chargementAdresse = true);
    try {
      final place = await ref.read(mapServiceProvider).reverseGeocode(lat, lng);
      if (!mounted) return;
      setState(() {
        _adresseCourante = place.displayName;
        _chargementAdresse = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _chargementAdresse = false);
    }
  }

  void _onMapEvent(MapEvent event) {
    if (event is MapEventMoveEnd) {
      _centre = event.camera.center;
      _geocoderInverse(_centre.latitude, _centre.longitude);
    }
  }

  void _rechercherAdresse(String query) {
    _debounce?.cancel();
    if (query.trim().length < 3) {
      setState(() => _resultatsRecherche = []);
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 500), () async {
      try {
        final resultats = await ref.read(mapServiceProvider).geocode(query);
        if (mounted) setState(() => _resultatsRecherche = resultats);
      } catch (_) {}
    });
  }

  void _selectionnerResultat(NominatimPlace place) {
    setState(() {
      _resultatsRecherche = [];
      _rechercheController.clear();
    });
    _centrerSur(place.latitude, place.longitude);
  }

  void _revenirAuDepart() {
    final state = ref.read(courseProvider);
    setState(() {
      _etape = _Etape.depart;
      _adresseCourante = state.adresseDepart;
      _resultatsRecherche = [];
    });
  }

  Future<void> _confirmerPoint() async {
    if (_adresseCourante == null) return;
    final notifier = ref.read(courseProvider.notifier);

    if (_etape == _Etape.depart) {
      notifier.definirDepart(
        latitude: _centre.latitude,
        longitude: _centre.longitude,
        adresse: _adresseCourante!,
      );
      setState(() {
        _etape = _Etape.arrivee;
        _adresseCourante = null;
        _resultatsRecherche = [];
      });
      return;
    }

    if (_etape == _Etape.arrivee) {
      notifier.definirArrivee(
        latitude: _centre.latitude,
        longitude: _centre.longitude,
        adresse: _adresseCourante!,
      );
      setState(() => _calculTrajetEnCours = true);
      final depart = ref.read(courseProvider);
      try {
        final route = await ref
            .read(mapServiceProvider)
            .getRoute(
              depart.latitudeDepart!,
              depart.longitudeDepart!,
              _centre.latitude,
              _centre.longitude,
            );
        notifier.definirDistanceDuree(
          distanceKm: route.distance / 1000,
          dureeEstimeeMin: (route.duration / 60).round(),
        );
      } catch (_) {
        // Non bloquant : la demande de course peut se faire sans distance/durée précalculées
      } finally {
        if (mounted) {
          setState(() {
            _calculTrajetEnCours = false;
            _etape = _Etape.categorie;
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(currentPositionProvider, (previous, next) {
      final position = next.valueOrNull;
      if (position != null &&
          !_positionInitialeAppliquee &&
          _etape == _Etape.depart) {
        _positionInitialeAppliquee = true;
        _centrerSur(position.latitude, position.longitude);
      }
    });

    if (_etape == _Etape.categorie) {
      return _EtapeCategorie(
        onRetour: () {
          final state = ref.read(courseProvider);
          setState(() {
            _etape = _Etape.arrivee;
            _adresseCourante = state.adresseArrivee;
          });
        },
      );
    }

    return PopScope(
      canPop: _etape == _Etape.depart,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (_etape == _Etape.arrivee) {
          _revenirAuDepart();
        }
      },
      child: Scaffold(
        appBar: AppBar(
          leading: _etape == _Etape.arrivee
              ? IconButton(
                  icon: const Icon(Icons.arrow_back),
                  onPressed: _revenirAuDepart,
                )
              : null,
          title: Text(
            _etape == _Etape.depart ? 'Point de départ' : 'Destination',
          ),
          centerTitle: true,
          elevation: 0,
          backgroundColor: AppColors.background,
          foregroundColor: AppColors.textPrimary,
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(20),
            child: Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _IndicateurProgression(
                etapeActive: _etape == _Etape.depart ? 1 : 2,
                totalEtapes: 3,
              ),
            ),
          ),
        ),
        body: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Column(
                children: [
                  TextField(
                    controller: _rechercheController,
                    onChanged: _rechercherAdresse,
                    decoration: InputDecoration(
                      hintText: 'Rechercher une adresse...',
                      prefixIcon: const Icon(Icons.search),
                      filled: true,
                      fillColor: AppColors.surface,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  if (_resultatsRecherche.isNotEmpty)
                    Container(
                      margin: const EdgeInsets.only(top: 8),
                      constraints: const BoxConstraints(maxHeight: 220),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 8,
                          ),
                        ],
                      ),
                      child: ListView.builder(
                        shrinkWrap: true,
                        itemCount: _resultatsRecherche.length,
                        itemBuilder: (context, index) {
                          final place = _resultatsRecherche[index];
                          return ListTile(
                            leading: const Icon(Icons.location_on_outlined),
                            title: Text(
                              place.displayName,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: AppTextStyles.bodySmall,
                            ),
                            onTap: () => _selectionnerResultat(place),
                          );
                        },
                      ),
                    ),
                ],
              ),
            ),
            Expanded(
              child: Stack(
                alignment: Alignment.center,
                children: [
                  FlutterMap(
                    mapController: _mapController,
                    options: MapOptions(
                      initialCenter: _centre,
                      initialZoom: 15,
                      onMapEvent: _onMapEvent,
                    ),
                    children: [
                      TileLayer(
                        urlTemplate:
                            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                        userAgentPackageName: 'ndjigi-mobile',
                      ),
                    ],
                  ),
                  IgnorePointer(
                    child: Icon(
                      Icons.location_pin,
                      size: 48,
                      color: _etape == _Etape.depart
                          ? AppColors.primary
                          : AppColors.error,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.background,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 8,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Adresse sélectionnée',
                    style: AppTextStyles.labelSmall.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  _chargementAdresse
                      ? const LinearProgressIndicator()
                      : Text(
                          _adresseCourante ??
                              'Déplacez la carte pour choisir un point',
                          style: AppTextStyles.bodyMedium,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                  const SizedBox(height: 16),
                  PrimaryButton(
                    label: _etape == _Etape.depart
                        ? 'Confirmer le départ'
                        : 'Confirmer la destination',
                    isDisabled: _adresseCourante == null || _chargementAdresse,
                    isLoading: _calculTrajetEnCours,
                    onPressed: _confirmerPoint,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Étape 3 : choix de la catégorie de véhicule ──────────────────────

class _EtapeCategorie extends ConsumerWidget {
  const _EtapeCategorie({required this.onRetour});

  final VoidCallback onRetour;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(courseProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Choisir un véhicule'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: onRetour,
        ),
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(20),
          child: Padding(
            padding: EdgeInsets.only(bottom: 12),
            child: _IndicateurProgression(etapeActive: 3, totalEtapes: 3),
          ),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _LigneAdresse(
              icon: Icons.trip_origin,
              label: state.adresseDepart ?? '',
            ),
            const SizedBox(height: 8),
            _LigneAdresse(
              icon: Icons.location_on,
              label: state.adresseArrivee ?? '',
            ),
            const SizedBox(height: 24),
            Text('Catégorie de véhicule', style: AppTextStyles.titleMedium),
            const SizedBox(height: 12),
            Expanded(
              child: state.isLoadingCategories
                  ? const Center(child: CircularProgressIndicator())
                  : state.categories.isEmpty
                  ? Center(
                      child: Text(
                        'Aucune catégorie disponible pour le moment.',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    )
                  : ListView.separated(
                      itemCount: state.categories.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final categorie = state.categories[index];
                        final selectionnee =
                            state.idCategorieSelectionnee ==
                            categorie.idCategorie;
                        return _CategorieCard(
                          categorie: categorie,
                          selectionnee: selectionnee,
                          onTap: () => ref
                              .read(courseProvider.notifier)
                              .selectionnerCategorie(categorie.idCategorie),
                        );
                      },
                    ),
            ),
            const SizedBox(height: 16),
            if (state.errorMessage != null) ...[
              Text(
                state.errorMessage!,
                style: AppTextStyles.bodySmall.copyWith(color: AppColors.error),
              ),
              const SizedBox(height: 8),
            ],
            PrimaryButton(
              label: 'Commander',
              isDisabled: !state.peutDemander,
              isLoading: state.isSubmitting,
              onPressed: () async {
                await ref.read(courseProvider.notifier).demanderCourse();
                if (!context.mounted) return;
                if (ref.read(courseProvider).course != null) {
                  context.push(Routes.searchingDriver);
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}

// ── Indicateur visuel de progression (étape active parmi le total) ───

class _IndicateurProgression extends StatelessWidget {
  const _IndicateurProgression({
    required this.etapeActive,
    required this.totalEtapes,
  });

  final int etapeActive;
  final int totalEtapes;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(totalEtapes, (index) {
        final numero = index + 1;
        final estActive = numero == etapeActive;
        final estCompletee = numero < etapeActive;
        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 3),
          height: 6,
          width: estActive ? 24 : 16,
          decoration: BoxDecoration(
            color: (estActive || estCompletee)
                ? AppColors.primary
                : AppColors.primary.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(3),
          ),
        );
      }),
    );
  }
}

class _LigneAdresse extends StatelessWidget {
  const _LigneAdresse({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.textSecondary),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            label,
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.textSecondary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

class _CategorieCard extends StatelessWidget {
  const _CategorieCard({
    required this.categorie,
    required this.selectionnee,
    required this.onTap,
  });

  final CategorieVehicule categorie;
  final bool selectionnee;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: selectionnee
              ? AppColors.primary.withValues(alpha: 0.08)
              : AppColors.background,
          border: Border.all(
            color: selectionnee ? AppColors.primary : AppColors.border,
            width: selectionnee ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primary.withValues(alpha: 0.12),
              ),
              child: const Icon(Icons.directions_car, color: AppColors.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    categorie.nom,
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (categorie.description != null)
                    Text(
                      categorie.description!,
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                ],
              ),
            ),
            if (selectionnee)
              const Icon(Icons.check_circle, color: AppColors.primary),
          ],
        ),
      ),
    );
  }
}
