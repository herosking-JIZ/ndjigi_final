import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import '../../../../core/constants/routes.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../providers/course_provider.dart';

// ── Chauffeur en approche, vérification d'identité, puis course en cours ──

class TripScreen extends ConsumerStatefulWidget {
  const TripScreen({super.key});

  @override
  ConsumerState<TripScreen> createState() => _TripScreenState();
}

class _TripScreenState extends ConsumerState<TripScreen> {
  bool _navigationDeclenchee = false;

  @override
  Widget build(BuildContext context) {
    ref.listen(courseProvider, (previous, next) {
      if (_navigationDeclenchee) return;
      if (next.course?.statut == 'termine') {
        _navigationDeclenchee = true;
        context.push(Routes.tripSummary);
      }
    });

    final state = ref.watch(courseProvider);
    final course = state.course;
    if (course == null) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    final latChauffeur = state.latitudeChauffeurLive;
    final lngChauffeur = state.longitudeChauffeurLive;
    final destinationLat = course.coordonneesArrivee?['latitude'] as num?;
    final destinationLng = course.coordonneesArrivee?['longitude'] as num?;

    double? distanceRestanteM;
    if (latChauffeur != null && lngChauffeur != null && destinationLat != null && destinationLng != null) {
      distanceRestanteM = Geolocator.distanceBetween(
        latChauffeur, lngChauffeur,
        destinationLat.toDouble(), destinationLng.toDouble(),
      );
    }

    final centre = latChauffeur != null && lngChauffeur != null
        ? LatLng(latChauffeur, lngChauffeur)
        : const LatLng(12.3657, -1.5197);

    return Scaffold(
      appBar: AppBar(
        title: Text(course.identiteConfirmee ? 'Course en cours' : 'Chauffeur en approche'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
        automaticallyImplyLeading: false,
      ),
      body: Column(
        children: [
          Expanded(
            child: Stack(
              children: [
                FlutterMap(
                  options: MapOptions(initialCenter: centre, initialZoom: 14),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'ndjigi-mobile',
                    ),
                    MarkerLayer(
                      markers: [
                        if (latChauffeur != null && lngChauffeur != null)
                          Marker(
                            point: LatLng(latChauffeur, lngChauffeur),
                            width: 44,
                            height: 44,
                            child: const Icon(Icons.local_taxi, color: AppColors.primary, size: 32),
                          ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.background,
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 8, offset: const Offset(0, -2)),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(course.chauffeurNom ?? '—', style: AppTextStyles.titleSmall),
                          Text(
                            '${course.vehiculeMarque ?? ''} ${course.vehiculeModele ?? ''} · ${course.vehiculeImmatriculation ?? ''}',
                            style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                    if (distanceRestanteM != null)
                      Text(
                        Formatters.formatDistance(distanceRestanteM),
                        style: AppTextStyles.titleMedium.copyWith(color: AppColors.primary),
                      ),
                  ],
                ),
                const SizedBox(height: 16),
                if (!course.identiteConfirmee)
                  PrimaryButton(
                    label: 'Le chauffeur est arrivé — confirmer son identité',
                    onPressed: () => ref.read(courseProvider.notifier).confirmerIdentite(),
                  )
                else
                  Text(
                    'Trajet en cours vers votre destination.',
                    style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
