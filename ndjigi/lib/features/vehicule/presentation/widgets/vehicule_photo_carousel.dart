import 'package:flutter/material.dart';
import '../../../../core/theme/colors.dart';
import '../../../../shared/widgets/authenticated_image.dart';
import '../../data/models/vehicule.dart';

/// Carrousel swipeable des photos d'un véhicule (bannière du détail), avec
/// indicateurs de pagination façon `CarrouselPub`. Affiche un placeholder si
/// la liste est vide.
class VehiculePhotoCarousel extends StatefulWidget {
  final List<PhotoVehicule> photos;
  final String Function(String idPhoto) urlBuilder;
  final double height;

  const VehiculePhotoCarousel({
    required this.photos,
    required this.urlBuilder,
    this.height = 220,
    super.key,
  });

  @override
  State<VehiculePhotoCarousel> createState() => _VehiculePhotoCarouselState();
}

class _VehiculePhotoCarouselState extends State<VehiculePhotoCarousel> {
  final _controller = PageController();
  int _currentPage = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.photos.isEmpty) {
      return SizedBox(height: widget.height, width: double.infinity, child: _placeholder());
    }

    return SizedBox(
      height: widget.height,
      width: double.infinity,
      child: Stack(
        children: [
          PageView.builder(
            controller: _controller,
            itemCount: widget.photos.length,
            onPageChanged: (index) => setState(() => _currentPage = index),
            itemBuilder: (context, index) {
              final url = widget.urlBuilder(widget.photos[index].idPhoto);
              return AuthenticatedImage(
                url: url,
                fit: BoxFit.cover,
                placeholderBuilder: (_) => _placeholder(),
              );
            },
          ),
          if (widget.photos.length > 1)
            Positioned(
              bottom: 12,
              left: 12,
              child: Row(
                children: List.generate(
                  widget.photos.length,
                  (index) => Container(
                    height: 8,
                    width: 8,
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    decoration: BoxDecoration(
                      color: _currentPage == index ? AppColors.primary : AppColors.border,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _placeholder() {
    return Container(
      color: AppColors.surfaceVariant,
      child: const Center(
        child: Icon(Icons.directions_car, size: 64, color: AppColors.textSecondary),
      ),
    );
  }
}
