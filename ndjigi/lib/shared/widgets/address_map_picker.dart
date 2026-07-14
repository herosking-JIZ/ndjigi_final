import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../core/theme/colors.dart';

class AddressMapPickerResult {
  final double latitude;
  final double longitude;

  AddressMapPickerResult({
    required this.latitude,
    required this.longitude,
  });
}

class AddressMapPicker extends StatefulWidget {
  final double? initialLatitude;
  final double? initialLongitude;
  final String title;

  const AddressMapPicker({
    super.key,
    this.initialLatitude,
    this.initialLongitude,
    this.title = 'Sélectionner un point sur la carte',
  });

  @override
  State<AddressMapPicker> createState() => _AddressMapPickerState();
}

class _AddressMapPickerState extends State<AddressMapPicker> {
  late MapController _mapController;
  late LatLng _selectedPoint;
  bool _pointSelected = false;

  @override
  void initState() {
    super.initState();
    _mapController = MapController();

    if (widget.initialLatitude != null && widget.initialLongitude != null) {
      _selectedPoint = LatLng(widget.initialLatitude!, widget.initialLongitude!);
      _pointSelected = true;
    } else {
      _selectedPoint = const LatLng(12.3657, -1.5197);
    }
  }

  @override
  void dispose() {
    _mapController.dispose();
    super.dispose();
  }

  void _onMapTap(LatLng point) {
    setState(() {
      _selectedPoint = point;
      _pointSelected = true;
    });
  }

  void _confirmSelection() {
    Navigator.pop(
      context,
      AddressMapPickerResult(
        latitude: _selectedPoint.latitude,
        longitude: _selectedPoint.longitude,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(widget.title),
        centerTitle: true,
        elevation: 0,
        backgroundColor: AppColors.background,
      ),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _selectedPoint,
              initialZoom: 13.0,
              onTap: (tapPosition, point) => _onMapTap(point),
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'ndjigi-mobile',
              ),
              if (_pointSelected)
                MarkerLayer(
                  markers: [
                    Marker(
                      point: _selectedPoint,
                      width: 80.0,
                      height: 80.0,
                      child: Icon(
                        Icons.location_on,
                        color: AppColors.primary,
                        size: 40,
                      ),
                    ),
                  ],
                ),
            ],
          ),
          if (_pointSelected)
            Positioned(
              bottom: 20,
              left: 16,
              right: 16,
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Point sélectionné ✓',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            color: AppColors.success,
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Lat: ${_selectedPoint.latitude.toStringAsFixed(4)}, Lng: ${_selectedPoint.longitude.toStringAsFixed(4)}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: _confirmSelection,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('Confirmer ce point'),
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            Positioned(
              bottom: 20,
              left: 16,
              right: 16,
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(16),
                child: Text(
                  'Appuyez sur la carte pour sélectionner un point',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
