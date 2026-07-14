import 'dart:async';
import 'package:flutter/material.dart';
import '../../../../core/theme/colors.dart';

class CarrouselPub extends StatefulWidget {
  final double height;
  final EdgeInsetsGeometry margin;

  const CarrouselPub({
    this.height = 160,
    this.margin = const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
    super.key,
  });

  @override
  State<CarrouselPub> createState() => _CarrouselPubState();
}

class _CarrouselPubState extends State<CarrouselPub> {
  late PageController _pageController;
  late int _currentPage;
  late Timer _autoScrollTimer;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _currentPage = 0;
    _startAutoScroll();
  }

  void _startAutoScroll() {
    _autoScrollTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (mounted && _pageController.hasClients) {
        int nextPage = (_currentPage + 1) % 3;
        _pageController.animateToPage(
          nextPage,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _autoScrollTimer.cancel();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: widget.margin,
      child: Stack(
        alignment: Alignment.bottomLeft,
        children: [
          SizedBox(
            height: widget.height,
            child: PageView.builder(
              controller: _pageController,
              onPageChanged: (index) {
                setState(() => _currentPage = index);
              },
              itemCount: 3,
              itemBuilder: (context, index) {
                final colors = [AppColors.primary, AppColors.secondary, AppColors.accent];
                final icons = [Icons.local_taxi, Icons.trending_up, Icons.star];
                return ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    decoration: BoxDecoration(
                      color: colors[index],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(icons[index], size: 48, color: Colors.white),
                        const SizedBox(height: 8),
                        Text(
                          ['Acceptez des courses', 'Augmentez vos gains', 'Recevez des évaluations'][index],
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          Positioned(
            bottom: 12,
            left: 12,
            child: Row(
              children: List.generate(
                3,
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
}
